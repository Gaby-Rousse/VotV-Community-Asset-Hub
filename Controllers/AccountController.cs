using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using VotVAssets.Models;

namespace VotVAssets.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;

        public AccountController(UserManager<IdentityUser> userManager,SignInManager<IdentityUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [HttpPost("register")] 
        public async Task<IActionResult> Register(RegisterModel model)
        {
            if (model.Password != model.ConfirmPassword)
            {
                return ValidationProblem("Passwords do not match");
            }

            string username = model.Username.Trim().Replace(' ', '_');
            var existingUser = await _userManager.FindByNameAsync(username);
            if (existingUser != null)
            {
                return BadRequest(new { error = "Username already taken" });
            }
            var user = new IdentityUser { UserName = username, Email = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);
            if (result.Succeeded)
            {
                return Ok("Registration successful");
            }
            return BadRequest(result.Errors);
        }
        
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginModel model)
        {
            string username = model.Username.Trim().Replace(' ', '_');
            var result = await _signInManager.PasswordSignInAsync(username, model.Password, false, false);
            if (result.Succeeded)
            {
                return Ok("Login successful");
            }
            return Unauthorized("Invalid email or password");
        }
    }
    
}