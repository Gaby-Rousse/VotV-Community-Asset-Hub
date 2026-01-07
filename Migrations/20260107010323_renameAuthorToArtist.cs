using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VotVAssets.Migrations
{
    /// <inheritdoc />
    public partial class renameAuthorToArtist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Pfp",
                table: "Authors",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Pfp",
                table: "Authors");
        }
    }
}
