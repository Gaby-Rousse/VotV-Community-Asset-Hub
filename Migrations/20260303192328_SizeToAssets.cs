using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VotVAssets.Migrations
{
    /// <inheritdoc />
    public partial class SizeToAssets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Size",
                table: "Assets");
        }
    }
}
