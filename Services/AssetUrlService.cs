using Amazon.S3;
using Amazon.S3.Model;
using VotVAssets.Models;
using VotVAssets.Models.Enums;

namespace VotVAssets.Services;

public class AssetUrlService(IAmazonS3 s3)
{
    public string ThumbnailUrl(Asset a)
    {
        if (string.IsNullOrEmpty(a.Thumbnail)) return "/images/picture.png";
        if (a.Thumbnail.StartsWith("temp/"))
            return Build($"temp_uploads/thumbnails/{a.Thumbnail["temp/".Length..]}", false);
        return Build($"uploads/thumbnails/{a.Thumbnail}", IsExplicit(a));
    }

    public string PreviewUrl(Asset a) =>
        string.IsNullOrEmpty(a.Preview) ? "NOT_AVAILABLE" : Build($"uploads/previews/{a.Preview}", IsExplicit(a));

    public string FileUrl(Asset a) => Build($"uploads/files/{a.Filename}", IsExplicit(a));

    private static bool IsExplicit(Asset a) => a.Rating == ContentRating.Explicit;

    private string Build(string path, bool isExplicit)
    {
        var key = $"VCAH/{path}";
        if (!isExplicit) return $"https://cdn.votvbroadcast.com/{key}";

        return s3.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = "votv-vcah-explicit",
            Key = key,
            Verb = HttpVerb.GET,
            Protocol = Protocol.HTTPS,
            Expires = DateTime.UtcNow.AddHours(1)
        });
    }
}