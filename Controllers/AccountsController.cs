using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VotVAssets.Models;

namespace VotVAssets.Controllers;

//https://www.c-sharpcorner.com/article/net-api-login-and-registration-using-identity/
[Route("api/[controller]")]
[ApiController]
public class AccountsController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromForm] RegisterModel model)
    {
        if (model.Password != model.ConfirmPassword)
            return BadRequest(new { error = "Password confirmation invalid." });

        var username = model.Username.Trim().Replace(' ', '_');
        var existingUser = await userManager.FindByNameAsync(username);
        if (existingUser != null) return BadRequest(new { error = "Username already taken." });
        var user = new IdentityUser { UserName = username, Email = model.Email };
        var result = await userManager.CreateAsync(user, model.Password);
        if (result.Succeeded) return Ok("Registration successful");
        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromForm] LoginModel model)
    {
        var username = model.Username.Trim().Replace(' ', '_');
        var result = await signInManager.PasswordSignInAsync(username, model.Password, false, false);
        if (result.Succeeded) return Ok("Login successful");
        return Unauthorized("Invalid email or password");
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var currentUser = await userManager.FindByNameAsync(User.Identity.Name);

            if (currentUser == null) return Ok(new { IsAuthenticated = false });

            var isAdmin = await userManager.IsInRoleAsync(currentUser, "Admin");

            return Ok(new
            {
                IsAuthenticated = true,
                Username = User.Identity.Name,
                currentUser.Id,
                IsAdmin = isAdmin
            });
        }

        return Ok(new { IsAuthenticated = false });
    }

    [HttpGet("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok();
    }
}