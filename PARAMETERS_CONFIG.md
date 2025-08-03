# Covenant Copilot API Parameters

## Optimized ChatGPT Configuration

The following parameters have been carefully tuned for Covenant Copilot to provide the most accurate, consistent, and helpful responses for HOA-related queries.

### Model Parameters

| Setting | Value | Purpose |
|---------|-------|---------|
| **Model** | `gpt-4o` | High accuracy, fast, cost-efficient |
| **Temperature** | `0.2` | Low randomness → more deterministic, accurate responses |
| **Top_p** | `1` | Standard value; governs diversity of output (use 1 with low temp) |
| **Frequency_penalty** | `0.0` | Prevents excessive repetition — not needed here |
| **Presence_penalty** | `0.0` | Keeps responses grounded and factual |
| **Max_tokens** | `3072` | Cap individual replies; balance between detail and performance |
| **Stop sequences** | `(none)` | Let the model reply until natural stop |
| **Response format** | `JSON` | Parseable response; includes metadata for debugging |

### Parameter Rationale

**GPT-4o Model Choice:**
- Superior accuracy compared to GPT-3.5-turbo
- Better understanding of complex HOA regulations
- More reliable citation and source handling
- Improved context retention across conversations

**Low Temperature (0.2):**
- Reduces randomness in responses
- Ensures consistent answers to similar questions
- Critical for legal/regulatory information accuracy
- Maintains professional tone consistency

**High Token Limit (3072):**
- Allows for comprehensive responses with full citations
- Accommodates detailed explanations of complex HOA rules
- Supports multiple examples and scenarios in one response
- Enables proper legal disclaimers and source references

**Zero Penalties:**
- Frequency penalty disabled to allow proper repetition of important terms (HOA, HRCA, etc.)
- Presence penalty disabled to ensure complete factual coverage
- Maintains natural language flow for better user experience

### Response Format

Each API response includes:

```json
{
  "message": "The AI assistant's response content",
  "timestamp": "2024-01-XX:XX:XX.XXXZ",
  "model": "gpt-4o",
  "parameters": {
    "temperature": 0.2,
    "max_tokens": 3072,
    "top_p": 1,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }
}
```

### Performance Benefits

1. **Higher Accuracy**: GPT-4o provides more reliable HOA regulation interpretation
2. **Consistency**: Low temperature ensures similar questions get similar answers
3. **Completeness**: Higher token limit allows comprehensive responses
4. **Debugging**: JSON response format includes parameter metadata
5. **Cost Efficiency**: GPT-4o offers better value per quality of response

### Monitoring

The API response includes the actual parameters used, enabling:
- Performance monitoring and optimization
- A/B testing of different parameter configurations
- Debugging of response quality issues
- Cost tracking and analysis