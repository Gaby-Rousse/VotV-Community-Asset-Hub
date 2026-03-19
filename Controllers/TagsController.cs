using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TagsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> GetTags(string? prefix = null, ItemEnum? item = null)
    {
        var query = context.Tags.AsQueryable();

        if (!string.IsNullOrWhiteSpace(prefix))
            query = query.Where(t => t.Name.StartsWith(prefix.ToLower().Trim()));

        var tags = await query
            .Select(t => new {
                name = t.Name,
                count = item.HasValue
                    ? t.Assets.Count(a => a.Item == item.Value)
                    : t.Assets.Count
            })
            .Where(t => t.count > 0)
            .OrderByDescending(t => t.count)
            .Take(8)
            .ToListAsync();

        return Ok(tags);
    }
}