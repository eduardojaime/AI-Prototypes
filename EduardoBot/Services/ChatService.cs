using System.Reflection.PortableExecutable;
using System.Text;
using Newtonsoft.Json;

class ChatService : IChatService
{
    private readonly IConfiguration _configuration;
    public ChatService(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    public string SendQuestion(string question)
    {
        string result = "";
        // Set the API endpoint and API key
        string apiEndpoint = "https://api.openai.com/v1/chat/completions";
        string apiKey = _configuration.GetSection("OpenAI")["ChatGPT"];
        Console.WriteLine($"Utilizing {apiKey}");
        // Create the JSON payload
        // TODO See Insomnia Personal POCs
        string requestJson = "{\"prompt\":\"Once upon a time\", \"temperature\":0.5, \"max_tokens\":100, \"n\":1, \"stop\":\"\\n\\n\"}";
        // Create a new HttpClient object
        using (var client = new HttpClient())
        {
            // Add the API key to the request header
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
            // Set the content type to JSON
            var content = new StringContent(requestJson, Encoding.UTF8, "application/json");
            // Make a POST request to the API endpoint
            var response = client.PostAsync(apiEndpoint, content).Result;
            // Check if the request was successful
            if (response.IsSuccessStatusCode)
            {
                // Deserialize the JSON response
                var responseJson = response.Content.ReadAsStringAsync().Result;
                var responseObject = JsonConvert.DeserializeObject<dynamic>(responseJson);
                // Extract the generated text from the response
                string generatedText = responseObject.choices[0].text;
                // Output the generated text
                result = generatedText;
            }
            else
            {
                Console.WriteLine(response);
                result = $"Request failed with status code: {response.StatusCode}";
            }
        }
        return result;
    }
}