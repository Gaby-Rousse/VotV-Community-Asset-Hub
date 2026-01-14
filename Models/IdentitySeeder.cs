using Microsoft.AspNetCore.Identity;

namespace VotVAssets.Models;

//Step 2: ttps://medium.com/@roshanj100/users-and-roles-seeding-in-asp-net-core-identity-with-entity-framework-core-a-step-by-step-guide-28e6f76a18db

public static class IdentitySeeder
{
    public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<IdentityUser>>();

        // Define roles to seed
        var roles = new[] { "Admin" };

        // Seed roles
        foreach (var role in roles)
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        string[] adminUsernames = { "Gaby_Rousse" };
        foreach (var username in adminUsernames)
        {
            var user = await userManager.FindByNameAsync(username);
            if (user != null)
                await userManager.AddToRoleAsync(user, "Admin");
        }
    }
}