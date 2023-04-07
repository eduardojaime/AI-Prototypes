class ChatResponse
{
    public string? Id;
    public string? Object;
    public long Created;
    public List<ChatChoices>? Choices;
    public ChatUsage? Usage;
}