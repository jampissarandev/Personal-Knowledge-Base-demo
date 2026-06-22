using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalKnowledgeBase.Api.Data;
using PersonalKnowledgeBase.Api.DTOs;
using PersonalKnowledgeBase.Api.Mappings;
using PersonalKnowledgeBase.Api.Middleware;
using PersonalKnowledgeBase.Api.Models;
using PersonalKnowledgeBase.Api.Services;
using Serilog;
using Serilog.Events;

MapsterConfig.Register();

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        path: "Logs/app-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Starting PersonalKnowledgeBase API");

    builder.Host.UseSerilog();

    builder.Services.AddControllers();

    builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(kv => kv.Value?.Errors.Count > 0)
                .ToDictionary(
                    kv => kv.Key,
                    kv => kv.Value!.Errors.Select(e => e.ErrorMessage).ToArray());
            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(
                ErrorResponse.Of("VALIDATION_ERROR", "One or more validation errors occurred.", errors));
        };
    });

    builder.Services.AddEndpointsApiExplorer();

    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new() { Title = "PersonalKnowledgeBase API", Version = "v1" });

        var schemeName = JwtBearerDefaults.AuthenticationScheme;

        options.AddSecurityDefinition(schemeName, new Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.ParameterLocation.Header,
            Description = "JWT Authorization header. Enter your token (no 'Bearer ' prefix)."
        });
        options.AddSecurityRequirement(_ => new Microsoft.OpenApi.OpenApiSecurityRequirement
        {
            [new Microsoft.OpenApi.OpenApiSecuritySchemeReference(schemeName, null)] = new List<string>()
        });
    });

    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));

    builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
        options.SignIn.RequireConfirmedAccount = false;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<INoteService, NoteService>();
    builder.Services.AddScoped<ITagService, TagService>();
    builder.Services.AddScoped<IFolderService, FolderService>();
    builder.Services.AddScoped<ISearchService, SearchService>();

    var allowedOrigins = builder.Configuration
        .GetSection("CorsSettings:AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:5173"];

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowClient", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    var jwtKey = jwtSettings["Key"] ?? throw new InvalidOperationException("JwtSettings:Key is not configured.");

    builder.Services
        .AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.FromMinutes(1)
            };

            options.Events = new JwtBearerEvents
            {
                OnChallenge = async context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(
                        """{"error":{"code":"UNAUTHORIZED","message":"Authentication required."}}""");
                }
            };
        });

    builder.Services.AddAuthorization();

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlingMiddleware>();

    app.UseSerilogRequestLogging();
    app.UseCors("AllowClient");

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "PersonalKnowledgeBase API v1");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
       .WithName("Health")
       .AllowAnonymous();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
