using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;
using VotVAssets.Services;
using System.Text.Json.Serialization;
using Amazon.Runtime;
using Amazon.S3;


//https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(o =>
{
    o.Limits.MaxRequestBodySize = 104_857_600;
});

builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var accessKey = "5ed48d2af137bce9530a28e6579bcd69";
    var secretKey = "f9f9714caa37712c5c1673cc17d93cc2af71b5aba299d8afecaeb167d30c2847";
    var credentials = new BasicAWSCredentials(accessKey, secretKey);

    return new AmazonS3Client(credentials, new AmazonS3Config
    {
        ServiceURL = $"https://1cd1b9eb03c0e49554f01fad54ca70ca.r2.cloudflarestorage.com",
    });
});


builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 104_857_600;
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
    opt.UseSqlServer(
        "Server=localhost;Database=VotVAssets;User Id=sa;Password=cW50MNIvJkwfbWwmCEIWIZumjIX7Q2Az5rdgGT3CqJelzIxiKU;TrustServerCertificate=True;"));

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

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider,
    ServeUnknownFileTypes = true,
    DefaultContentType = "application/octet-stream",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=31536000"; 
    }
    
});

app.UseAuthentication();
app.UseAuthorization();


app.MapControllers();

if (app.Environment.IsProduction())
{
    app.MapFallbackToFile("index.html");
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


app.Run();