using System.Security.Claims;
using VotVAssets.Models;
using VotVAssets.Models.Enums;

namespace VotVAssets.Extensions;

public static class AssetQueryExtensions
{
    public const string ExplicitConsentClaim = "explicit_consent";

    public static bool CanSeeExplicit(this ClaimsPrincipal user) =>
        user.Identity?.IsAuthenticated == true
        && user.HasClaim(c => c.Type == ExplicitConsentClaim);

    public static IQueryable<Asset> VisibleTo(this IQueryable<Asset> query, ClaimsPrincipal user) =>
        user.CanSeeExplicit() ? query : query.Where(a => a.Rating != ContentRating.Explicit);
}