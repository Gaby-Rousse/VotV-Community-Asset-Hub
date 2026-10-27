using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VotVAssets.Migrations
{
    /// <inheritdoc />
    public partial class RawSize : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Size",
                table: "Assets");

            migrationBuilder.AddColumn<long>(
                name: "RawSize",
                table: "Assets",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RawSize",
                table: "Assets");

            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
