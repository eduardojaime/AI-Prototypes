var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IChatService, ChatService>();

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.MapGet("/SendQuestion", (string message, IChatService chatService) =>
{
    try
    {
        Console.WriteLine("Received Message: " + message);
        return Results.Ok(chatService.SendQuestion(message));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(ex);
    }
});

app.Run();
