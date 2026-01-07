using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VotVAssets.Models;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountsController : ControllerBase
{
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly UserManager<IdentityUser> _userManager;

    public AccountsController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterModel model)
    {
        if (model.Password != model.ConfirmPassword) return ValidationProblem("Passwords do not match");

        var username = model.Username.Trim().Replace(' ', '_');
        var existingUser = await _userManager.FindByNameAsync(username);
        if (existingUser != null) return BadRequest(new { error = "Username already taken" });
        var user = new IdentityUser { UserName = username, Email = model.Email };
        var result = await _userManager.CreateAsync(user, model.Password);
        if (result.Succeeded) return Ok("Registration successful");
        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginModel model)
    {
        var username = model.Username.Trim().Replace(' ', '_');
        var result = await _signInManager.PasswordSignInAsync(username, model.Password, false, false);
        if (result.Succeeded) return Ok("Login successful");
        return Unauthorized("Invalid email or password");
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        if (User.Identity?.IsAuthenticated == true)
            return Ok(new
            {
                IsAuthenticated = true,
                Username = User.Identity.Name
            });
        return Ok(new { IsAuthenticated = false });
    }
}