# Cerebro Architecture

- Author: Eduardo Jaime
- Date Added: 2023-04-18
- Version: 1.0

## Components

The proposed architecture contains 4 layers:

1. Client Layer: All applications that access the AI system via REST requests.
2. Services Layer: This layer is composed of the following components.
    - At least 1 API gateway, which will be the single entry point to the services.
    - 1 or more Business Logic services.
    - At least 1 repository service that connects to the data layer for logging.
3. AI Layer: This layer contains all functionality that implements any AI technology.
    - At least 1 filter service that works as the entry point to the AI layer and helps filter the input and output coming from the AI service.
    - At least 1 AI service that implements an AI technology such as OpenAI.
4. Data Layer: Contains databases utilized for logging.

## Diagram

Reference diagram below:

![Reference Diagram](/RefArch/diagrams\cerebroarchitecture.png)

## Change Log

Version 1.0 - Initial architectural diagram