using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;
using VotVAssets.Models.Enums;
using VotVAssets.Services;
using System.Text.Json.Serialization;
using Amazon.Runtime;
using Amazon.S3;
using System.Web;
using Microsoft.Extensions.Primitives;

//https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(o =>
{
    o.Limits.MaxRequestBodySize = 104_857_600;
});
builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 104_857_600;
});

builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var accessKey = builder.Configuration["S3:access-key"];
    var secretKey = builder.Configuration["S3:secret-key"];
    var credentials = new BasicAWSCredentials(accessKey, secretKey);

    return new AmazonS3Client(credentials, new AmazonS3Config
    {
        ServiceURL = builder.Configuration["S3:service-url"],
    });
});


builder.Services.AddAuthorization();
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
    {
        options.SignIn.RequireConfirmedAccount = false;
        options.SignIn.RequireConfirmedEmail = false;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>();

// Add services to the container.
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        //archi gossant
        options.AddPolicy(MyAllowSpecificOrigins,
            policy =>
            {
                policy.WithOrigins("http://10.0.0.131:5173").AllowAnyHeader().AllowAnyMethod().AllowCredentials();
            });
    });
}

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddDbContext<ApplicationDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration["ConnectionString"]));

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var firstError = context.ModelState
            .Where(x => x.Value.Errors.Count > 0)
            .Select(x => x.Value.Errors.First().ErrorMessage)
            .FirstOrDefault() ?? "Validation failed";

        return new BadRequestObjectResult(new { error = firstError });
    };
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//Registers custom functions
builder.Services.AddScoped<FileService>();
builder.Services.AddSingleton<AssetUrlService>();

builder.Services.AddMemoryCache();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    if (!await roleManager.RoleExistsAsync("Admin")) await roleManager.CreateAsync(new IdentityRole("Admin"));
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();


if (app.Environment.IsDevelopment())
{
    app.UseCors(MyAllowSpecificOrigins);
}
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".glb"] = "model/gltf-binary";
provider.Mappings[".gltf"] = "model/gltf+json";

app.Use(async (ctx, next) =>
{
    var path = ctx.Request.Path;
    if (path.StartsWithSegments("/uploads") || path.StartsWithSegments("/temp_uploads"))
    {
        ctx.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }
    await next(ctx);
});

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider,
    ServeUnknownFileTypes = true,
    DefaultContentType = "application/octet-stream",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=31536000"; 
        ctx.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    }
    
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsProduction())
{
    var indexHtml = await File.ReadAllTextAsync(Path.Combine(app.Environment.WebRootPath, "index.html"));

    app.MapFallback(async (HttpContext ctx, ApplicationDbContext db, AssetUrlService urls) =>
    {
        var urlParams = ctx.Request.Query;
        var baseUrl = $"https://{ctx.Request.Host}";

        string title = "VotV Community Asset Hub";
        string description = "Browse VotV assets shared by the community!";
        string image = $"https://cdn.votvbroadcast.com/public/assets/REPLACEME.png";
        bool largeImage = false;

        //generate new og from the params, only matter inside the assets page.
        if (ctx.Request.Path.StartsWithSegments("/assets"))
        {
            if (!StringValues.IsNullOrEmpty(urlParams["assetId"]))
            {
                var asset = await db.Assets.Where(a => a.Id == long.Parse(urlParams["assetId"]!)).Include(a => a.Artist)
                    .FirstOrDefaultAsync();
                if (asset != null && asset.Rating != ContentRating.Explicit)
                {
                    title = asset.Name;
                    description = $"By: {asset.Artist?.Name}";
                    if (asset.Preview != null)
                        image = $"https://cdn.votvbroadcast.com/VCAH/uploads/previews/{Path.ChangeExtension(asset.Preview, null) + "_TT.gif"}";
                    else
                        image = urls.ThumbnailUrl(asset);

                    largeImage = true;
                }
            }

            if (!StringValues.IsNullOrEmpty(urlParams["view"]))
            {
                if (!StringValues.IsNullOrEmpty(urlParams["artistId"]) && urlParams["view"].ToString() == "artists")
                {
                    var artist = await db.Artists.Where(a => a.Id == long.Parse(urlParams["artistId"]!)).FirstOrDefaultAsync();
                    if (artist != null)
                    {
                        title = artist.Name;
                        description = artist.Description ?? $"See {artist.Name} profile on VCAH.";
                        image = artist.Pfp != null ? $"https://cdn.votvbroadcast.com/VCAH/uploads/avatars/{artist.Pfp}" : "https://cdn.votvbroadcast.com/VCAH/uploads/avatars/defaultPicture.png";
                        largeImage = false;
                    }
                }

                if (!StringValues.IsNullOrEmpty(urlParams["tagId"]) && urlParams["view"].ToString() == "collections")
                {
                    var tag = await db.Tags.Where(t => t.Id == long.Parse(urlParams["tagId"]!)).FirstOrDefaultAsync();
                    if (tag != null)
                    {
                        title = tag.Name;
                        description = tag.Description ?? $"Browse all assets tagged with {tag.Name}.";
                        image = tag.Thumbnail != null ? $"https://cdn.votvbroadcast.com/VCAH/uploads/thumbnails/{tag.Thumbnail}" : "https://cdn.votvbroadcast.com/public/assets/defaultPicture.png";
                        largeImage = false;
                    }
                }

            }
            else
            {
                if (!StringValues.IsNullOrEmpty(urlParams["search"]))
                {
                    if (!StringValues.IsNullOrEmpty(urlParams["searchBy"]))
                    {
                        SearchBy searchBy = (SearchBy)int.Parse(urlParams["searchBy"]!);
                        if (searchBy == SearchBy.Artist)
                        {
                            var artist = await db.Artists.Where(a => a.Name == urlParams["search"].ToString()).FirstOrDefaultAsync();
                            if (artist != null)
                            {
                                title = artist.Name;
                                description = artist.Description ?? $"See assets made by {artist.Name}";
                                image = artist.Pfp != null ? $"https://cdn.votvbroadcast.com/VCAH/uploads/avatars/{artist.Pfp}" : "https://cdn.votvbroadcast.com/VCAH/uploads/avatars/defaultPicture.png";
                                largeImage = false;
                            }
                        }
                        else
                        {
                            description = "what are you doing, if you see this your queries are weird. ";
                        }
                    }
                    else
                    {
                        description = $"See assets with the following query: {urlParams["search"].ToString()}";
                        image = "https://cdn.votvbroadcast.com/public/assets/magnifier.png";
                        largeImage = false;
                    }
                }
            }
        }

        var url = $"{baseUrl}{ctx.Request.Path}{ctx.Request.QueryString}";

        var tags = $"""
            <title>{HttpUtility.HtmlEncode(title)}</title>
            <meta name="description" content="{HttpUtility.HtmlEncode(description)}">
            <meta property="og:title" content="{HttpUtility.HtmlEncode(title)}">
            <meta property="og:description" content="{HttpUtility.HtmlEncode(description)}">
            <meta property="og:image" content="{HttpUtility.HtmlEncode(image)}">
            <meta property="og:url" content="{HttpUtility.HtmlEncode(url)}">
            <meta property="og:site_name" content="VotV Community Asset Hub">
            <meta name="twitter:card" content="{(largeImage ? "summary_large_image" : "summary")}">
            """;

        var html = indexHtml.Replace("</head>", tags + "</head>");

        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.Headers.CacheControl = "no-cache";
        await ctx.Response.WriteAsync(html);
    });
}


//app.MapIdentityApi<IdentityUser>();


//Step 3: https://medium.com/@roshanj100/users-and-roles-seeding-in-asp-net-core-identity-with-entity-framework-core-a-step-by-step-guide-28e6f76a18db
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await IdentitySeeder.SeedRolesAndAdminAsync(services);
}

if (args.Contains("--resize-images"))
{
    await ResizeMigrationJob.RunAsync(app.Services);
    return;
}

if (args.Contains("--generate-previews-ATV"))
{
    await GeneratePreviewsForATV.RunAsync(app.Services);
    return;
}

if (args.Contains("--move-explicit"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var files = scope.ServiceProvider.GetRequiredService<FileService>();

    var explicitAssets = await db.Assets.Where(a => a.Rating == ContentRating.Explicit).ToListAsync();
    foreach (var asset in explicitAssets)
        await files.SyncBucket(asset, false);

    Console.WriteLine($"Moved {explicitAssets.Count} assets.");
    return;
}

if (args.Contains("--generate-TT"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var files = scope.ServiceProvider.GetRequiredService<FileService>();
    int i = 0;

    var assetsWithPreview = await db.Assets.Where(a => a.Preview != null).ToListAsync();
    var count = assetsWithPreview.Count;

    foreach (var asset in assetsWithPreview)
    {
        string preview = asset.Preview!;
        var result = await files.HandleTurnTable(preview);
        Console.WriteLine(result != null ? $"Generated turn table for {preview}." : $"FAILED: {preview}");
        Console.WriteLine($"{i}/{count}");
    }



    Console.WriteLine($"Generated {count} GIF files.");
    return;
}



app.Run();