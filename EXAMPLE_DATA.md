# Example Data for Forms and Responses

This document provides example data structures for creating forms and submitting responses.

## 1. Creating a Form

### POST `/api/forms`

**Required Fields:**
- `name` (string) - Form name
- `airtableBaseId` (string) - Airtable base ID
- `airtableBaseName` (string) - Airtable base name (optional but recommended)
- `airtableTableId` (string) - Airtable table ID
- `airtableTableName` (string) - Airtable table name (optional but recommended)
- `questions` (array) - Array of question objects

**Optional Fields:**
- `description` (string) - Form description

### Example Form Creation Data

```json
{
  "name": "Customer Feedback Form",
  "description": "Collect feedback from customers about our products and services",
  "airtableBaseId": "appXXXXXXXXXXXXXX",
  "airtableBaseName": "Customer Management",
  "airtableTableId": "tblXXXXXXXXXXXXXX",
  "airtableTableName": "Feedback",
  "questions": [
    {
      "questionKey": "q_1734567890_abc123",
      "airtableFieldId": "fldXXXXXXXXXXXXXX1",
      "airtableFieldName": "Customer Name",
      "label": "What is your name?",
      "type": "singleLineText",
      "options": [],
      "required": true,
      "conditionalRules": null
    },
    {
      "questionKey": "q_1734567891_def456",
      "airtableFieldId": "fldXXXXXXXXXXXXXX2",
      "airtableFieldName": "Email",
      "label": "What is your email address?",
      "type": "singleLineText",
      "options": [],
      "required": true,
      "conditionalRules": null
    },
    {
      "questionKey": "q_1734567892_ghi789",
      "airtableFieldId": "fldXXXXXXXXXXXXXX3",
      "airtableFieldName": "Product Rating",
      "label": "How would you rate our product?",
      "type": "singleSelect",
      "options": ["Excellent", "Good", "Average", "Poor", "Very Poor"],
      "required": true,
      "conditionalRules": null
    },
    {
      "questionKey": "q_1734567893_jkl012",
      "airtableFieldId": "fldXXXXXXXXXXXXXX4",
      "airtableFieldName": "Feedback",
      "label": "Please provide your detailed feedback",
      "type": "multilineText",
      "options": [],
      "required": false,
      "conditionalRules": null
    },
    {
      "questionKey": "q_1734567894_mno345",
      "airtableFieldId": "fldXXXXXXXXXXXXXX5",
      "airtableFieldName": "Interested Features",
      "label": "Which features are you interested in? (Select all that apply)",
      "type": "multipleSelects",
      "options": ["Feature A", "Feature B", "Feature C", "Feature D"],
      "required": false,
      "conditionalRules": null
    },
    {
      "questionKey": "q_1734567895_pqr678",
      "airtableFieldId": "fldXXXXXXXXXXXXXX6",
      "airtableFieldName": "Attachments",
      "label": "Upload any supporting documents or screenshots",
      "type": "multipleAttachments",
      "options": [],
      "required": false,
      "conditionalRules": null
    },
    {
      "questionKey": "q_1734567896_stu901",
      "airtableFieldId": "fldXXXXXXXXXXXXXX7",
      "airtableFieldName": "Contact Preference",
      "label": "How would you like us to contact you?",
      "type": "singleSelect",
      "options": ["Email", "Phone", "SMS", "No Contact"],
      "required": false,
      "conditionalRules": {
        "logic": "AND",
        "conditions": [
          {
            "questionKey": "q_1734567892_ghi789",
            "operator": "equals",
            "value": "Excellent"
          }
        ]
      }
    }
  ]
}
```

### Form with Conditional Logic Example

```json
{
  "name": "Event Registration Form",
  "description": "Register for our upcoming event",
  "airtableBaseId": "appYYYYYYYYYYYYYY",
  "airtableBaseName": "Events",
  "airtableTableId": "tblYYYYYYYYYYYYYY",
  "airtableTableName": "Registrations",
  "questions": [
    {
      "questionKey": "q_1734567900_xyz123",
      "airtableFieldId": "fldYYYYYYYYYYYYYY1",
      "airtableFieldName": "Full Name",
      "label": "Full Name",
      "type": "singleLineText",
      "options": [],
      "required": true,
      "conditionalRules": null
    },
    {
      "questionKey": "q_1734567901_abc456",
      "airtableFieldId": "fldYYYYYYYYYYYYYY2",
      "airtableFieldName": "Event Type",
      "label": "Which event are you interested in?",
      "type": "singleSelect",
      "options": ["Workshop", "Conference", "Webinar", "Networking"],
      "required": true,
      "conditionalRules": null
    },
    {
      "questionKey": "q_1734567902_def789",
      "airtableFieldId": "fldYYYYYYYYYYYYYY3",
      "airtableFieldName": "Workshop Topic",
      "label": "Which workshop topic interests you?",
      "type": "singleSelect",
      "options": ["Web Development", "Data Science", "Design", "Marketing"],
      "required": true,
      "conditionalRules": {
        "logic": "AND",
        "conditions": [
          {
            "questionKey": "q_1734567901_abc456",
            "operator": "equals",
            "value": "Workshop"
          }
        ]
      }
    },
    {
      "questionKey": "q_1734567903_ghi012",
      "airtableFieldId": "fldYYYYYYYYYYYYYY4",
      "airtableFieldName": "Dietary Requirements",
      "label": "Do you have any dietary requirements?",
      "type": "multipleSelects",
      "options": ["Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "None"],
      "required": false,
      "conditionalRules": {
        "logic": "OR",
        "conditions": [
          {
            "questionKey": "q_1734567901_abc456",
            "operator": "equals",
            "value": "Conference"
          },
          {
            "questionKey": "q_1734567901_abc456",
            "operator": "equals",
            "value": "Workshop"
          }
        ]
      }
    }
  ]
}
```

## 2. Submitting a Form Response

### POST `/api/forms/:formId/submit`

**Required Fields:**
- `answers` (object) - Object where keys are `questionKey` values and values are the answers

### Answer Format by Field Type

- **singleLineText**: `string`
- **multilineText**: `string`
- **singleSelect**: `string` (must match one of the options)
- **multipleSelects**: `array of strings` (each string must match one of the options)
- **multipleAttachments**: `array of strings` (URLs after file upload)

### Example Response Data

#### Simple Response (No Conditional Logic)

```json
{
  "answers": {
    "q_1734567890_abc123": "John Doe",
    "q_1734567891_def456": "john.doe@example.com",
    "q_1734567892_ghi789": "Excellent",
    "q_1734567893_jkl012": "I really enjoyed using your product. The interface is intuitive and the features are exactly what I needed.",
    "q_1734567894_mno345": ["Feature A", "Feature C"],
    "q_1734567896_stu901": "Email"
  }
}
```

#### Response with File Attachments

```json
{
  "answers": {
    "q_1734567890_abc123": "Jane Smith",
    "q_1734567891_def456": "jane.smith@example.com",
    "q_1734567892_ghi789": "Good",
    "q_1734567893_jkl012": "Overall good experience, but I have some suggestions for improvement.",
    "q_1734567894_mno345": ["Feature B", "Feature D"],
    "q_1734567895_pqr678": [
      "https://your-server.com/uploads/file1.pdf",
      "https://your-server.com/uploads/screenshot.png"
    ]
  }
}
```

#### Response with Conditional Logic (Event Registration Example)

```json
{
  "answers": {
    "q_1734567900_xyz123": "Alice Johnson",
    "q_1734567901_abc456": "Workshop",
    "q_1734567902_def789": "Web Development",
    "q_1734567903_ghi012": ["Vegetarian", "Gluten-Free"]
  }
}
```

**Note:** In the above example, `q_1734567902_def789` (Workshop Topic) is shown because the Event Type is "Workshop", and `q_1734567903_ghi012` (Dietary Requirements) is shown because Event Type is either "Conference" or "Workshop".

#### Response with Conditional Logic (Conference Example)

```json
{
  "answers": {
    "q_1734567900_xyz123": "Bob Williams",
    "q_1734567901_abc456": "Conference",
    "q_1734567903_ghi012": ["Vegan"]
  }
}
```

**Note:** In this example, `q_1734567902_def789` (Workshop Topic) is NOT included because Event Type is "Conference", not "Workshop".

## 3. Field Type Details

### Supported Field Types

1. **singleLineText**
   - Answer format: `"string"`
   - Example: `"John Doe"`

2. **multilineText**
   - Answer format: `"string"` (can contain newlines)
   - Example: `"This is a multi-line\nresponse with multiple\nparagraphs."`

3. **singleSelect**
   - Answer format: `"string"` (must be one of the options)
   - Example: `"Excellent"`

4. **multipleSelects**
   - Answer format: `["option1", "option2"]` (array of strings, each must be one of the options)
   - Example: `["Feature A", "Feature C", "Feature D"]`

5. **multipleAttachments**
   - Answer format: `["url1", "url2"]` (array of file URLs after upload)
   - Example: `["https://server.com/uploads/file1.pdf", "https://server.com/uploads/image.jpg"]`
   - **Note:** Files must be uploaded first using the file upload endpoint, then the returned URLs are used in the response.

## 4. Conditional Logic Rules

### Condition Operators

- `equals` - Answer must exactly match the value
- `notEquals` - Answer must not match the value
- `contains` - Answer (string or array) must contain the value

### Logic Types

- `AND` - All conditions must be true
- `OR` - At least one condition must be true

### Conditional Rules Structure

```json
{
  "logic": "AND",
  "conditions": [
    {
      "questionKey": "q_1734567892_ghi789",
      "operator": "equals",
      "value": "Excellent"
    },
    {
      "questionKey": "q_1734567894_mno345",
      "operator": "contains",
      "value": "Feature A"
    }
  ]
}
```

## 5. Testing Tips

### Using cURL to Create a Form

```bash
curl -X POST http://localhost:5000/api/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @form_data.json
```

### Using cURL to Submit a Response

```bash
curl -X POST http://localhost:5000/api/forms/FORM_ID/submit \
  -H "Content-Type: application/json" \
  -d @response_data.json
```

### Using Postman/Insomnia

1. **Create Form:**
   - Method: POST
   - URL: `http://localhost:5000/api/forms`
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
   - Body: JSON (use the form creation example above)

2. **Submit Response:**
   - Method: POST
   - URL: `http://localhost:5000/api/forms/FORM_ID/submit`
   - Body: JSON (use the response submission example above)

## 6. Common Mistakes to Avoid

1. **Missing required fields** - Ensure all required questions have answers
2. **Invalid option values** - For singleSelect and multipleSelects, ensure values match exactly with the options array
3. **Wrong data types** - multipleSelects and multipleAttachments must be arrays, not strings
4. **Missing questionKey** - Each answer key must match a questionKey from the form
5. **Conditional logic** - Don't include answers for questions that shouldn't be visible based on conditional rules
6. **File uploads** - For multipleAttachments, upload files first and use the returned URLs, not File objects

