import { tools } from "./definitions";
import { ToolDefinition, ToolExecutionContext } from "../types";
import { executeWithPermissions } from "../agent/permissions";

const toolMap = new Map<string, ToolDefinition>();
for (const tool of tools) {
  toolMap.set(tool.name, tool);
}

export function findTool(name: string): ToolDefinition | undefined {
  return toolMap.get(name);
}

export function listTools(): ToolDefinition[] {
  return tools;
}

/**
 * Converts internal tool definitions to Gemini function declaration formats.
 */
export function getGeminiFunctionDeclarations() {
  return tools.map((tool) => {
    // Generate JSON schema from Zod schema
    const shape = (tool.schema as any)._def?.shape?.() || {};
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, field] of Object.entries(shape)) {
      const typeName = (field as any)._def?.typeName;
      let type = "string";
      if (typeName === "ZodNumber") type = "number";
      if (typeName === "ZodBoolean") type = "boolean";
      if (typeName === "ZodArray") type = "array";
      if (typeName === "ZodObject") type = "object";

      properties[key] = {
        type,
        description: `Field: ${key}`,
      };

      if (typeName !== "ZodOptional" && typeName !== "ZodDefault") {
        required.push(key);
      }
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
      },
    };
  });
}

/**
 * Converts internal tool definitions to OpenAI / Groq tool schemas.
 */
export function getGroqToolSchemas() {
  return tools.map((tool) => {
    const shape = (tool.schema as any)._def?.shape?.() || {};
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, field] of Object.entries(shape)) {
      const typeName = (field as any)._def?.typeName;
      let type = "string";
      if (typeName === "ZodNumber") type = "number";
      if (typeName === "ZodBoolean") type = "boolean";
      if (typeName === "ZodArray") type = "array";
      if (typeName === "ZodObject") type = "object";

      properties[key] = { type };
      if (typeName !== "ZodOptional" && typeName !== "ZodDefault") {
        required.push(key);
      }
    }

    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    };
  });
}

export async function executeToolCall(
  toolName: string,
  rawArguments: Record<string, any>,
  context: ToolExecutionContext
) {
  const tool = findTool(toolName);
  if (!tool) {
    throw new Error(`Tool "${toolName}" is not registered in the tool registry.`);
  }

  // Validate arguments using Zod
  const parsedArgs = tool.schema.parse(rawArguments || {});

  // Pass through Permission Middleware
  return executeWithPermissions(tool, parsedArgs, context);
}

