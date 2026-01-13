using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;

//https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);
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

builder.Services.AddCors(options =>
{
    //archi gossant
    options.AddPolicy(MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("http://10.0.0.131:5173").AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        });
});

builder.Services.AddControllers();

builder.Services.AddDbContext<ApplicationDbContext>(opt =>
    opt.UseSqlServer(
        "Server=localhost;Database=VotVAssets;User Id=sa;Password=rDL2AxiHdEPMJHPOeK2K40EZSqvo2IHMnbZzduXf4pPqIhT0Y8;TrustServerCertificate=True;"));

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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


app.UseCors(MyAllowSpecificOrigins);


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

//app.MapIdentityApi<IdentityUser>();

app.UseStaticFiles();

app.Run();