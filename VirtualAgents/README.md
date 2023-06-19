# Using Open AI with Virtual Agents

Virtual Agents can be created but conversation flows are programmed into them by a developer
Azure OpenAI can be integrated with Virtual Agents to add GPT capabilities

https://www.youtube.com/watch?v=q8tDMfyhbSg

By creating a chatbot from Power Platform, and linking it to your website, the VA can index the site and GPT fills in the gap by

New VA > Topics > Create with Copilot 

VA are expensive (100 per month)

## Notes on PVA + GPT

[Let's get the best of OpenAI in Power Virtual Agent!](https://www.youtube.com/watch?v=gmlolQDbod4&list=WL&index=7)

## Steps to Access Azure Open AI:

[Azure Open AI Technical Briefing](https://www.youtube.com/watch?v=lHw1tZhXlEo)

1. Azure Subscription
2. Navigate to Open AI resources
3. Click on link to fill in form to request access to these resources
4. Fill in information required
5. Wait for it to be approved (around 10 business days)

TODO

PVA ARCHITECTURE https://www.youtube.com/watch?v=AdpCz6aKl2M
Open AI + Cognitive Search (chat app, not PVA) https://www.youtube.com/watch?v=iS36n9rO6OQ

# Notes on ChatGPT (Applying it ot our data)

[Connect ChatGPT to your Enterprise Data using Cognitive Search](https://www.youtube.com/watch?v=cTe3VaYqtBU)
[¿ChatGPT puede funcionar con los datos de su empresa?](https://www.youtube.com/watch?v=tW2EA4aZ_YQ)
[Revolutionize your Enterprise Data with ChatGPT: Next-gen Apps w/ Azure OpenAI and Cognitive Search](https://techcommunity.microsoft.com/t5/ai-applied-ai-blog/revolutionize-your-enterprise-data-with-chatgpt-next-gen-apps-w/ba-p/3762087)

Basically ChatGPT cannot be extended, trained or fine tuned with our organization data. This is due to the fact that it is already trained and fine tuned (GPT). Retraining and fine tuning are expensive tasks that require a lot of storage space (in TBs) and processing power.

Azure Cognitive Search can resolve this limitation:

- Indexing > Convert documents into inverted indexes for search
- Querying > Retrieve information from the indexes based on a query

Demo repo:

- https://github.com/Azure-Samples/azure-search-openai-demo/

Cognitive Search Demo:

- https://jj09.net/cognitive-search-azure-search-with-ai/
- https://github.com/microsoft/AzureSearch_JFK_Files
- https://github.com/jj09/azsearch.js