import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { connectIntegrationSchema } from "@/lib/validators/integration";
import { encrypt } from "@/lib/encryption";
import { RechargeService } from "@/lib/services/recharge";
import { AirtableService } from "@/lib/services/airtable";
import { IntercomService } from "@/lib/services/intercom";
import { GorgiasService } from "@/lib/services/gorgias";
import { PlaudService } from "@/lib/services/plaud";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({ where: { id } });
    if (!integration) return apiError("Integration not found", 404);

    const result = await parseAndValidate(request, connectIntegrationSchema);
    if ("error" in result) return result.error;

    const { apiToken } = result.data;

    // Test connection before saving
    if (integration.slug === "recharge") {
      const svc = new RechargeService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "airtable") {
      const svc = new AirtableService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "intercom") {
      const svc = new IntercomService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "gorgias") {
      const { domain, email } = result.data;
      if (!domain || !email) {
        return apiError("Domain and email are required for Gorgias", 400);
      }
      const svc = new GorgiasService(domain, email, apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "plaud") {
      const region = (result.data.region as "us" | "eu") || "us";
      const svc = new PlaudService(apiToken, region);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "asana") {
      const { AsanaService } = await import("@/lib/services/asana");
      const svc = new AsanaService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "trello") {
      const apiKey = result.data.apiKey;
      if (!apiKey) return apiError("API Key is required for Trello", 400);
      const { TrelloService } = await import("@/lib/services/trello");
      const svc = new TrelloService(apiKey, apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "jira") {
      const { domain, email } = result.data;
      if (!domain || !email) return apiError("Domain and email are required for Jira", 400);
      const { JiraService } = await import("@/lib/services/jira");
      const svc = new JiraService(domain as string, email as string, apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "notion") {
      const { NotionTasksService } = await import("@/lib/services/notion-tasks");
      const svc = new NotionTasksService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "linear") {
      const { LinearService } = await import("@/lib/services/linear");
      const svc = new LinearService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "monday") {
      const { MondayService } = await import("@/lib/services/monday");
      const svc = new MondayService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "clickup") {
      const { ClickUpService } = await import("@/lib/services/clickup");
      const svc = new ClickUpService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "attio") {
      const { AttioService } = await import("@/lib/services/attio");
      const svc = new AttioService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "salesforce") {
      const { domain } = result.data;
      if (!domain) return apiError("Instance URL is required for Salesforce", 400);
      const { SalesforceService } = await import("@/lib/services/salesforce");
      const svc = new SalesforceService(apiToken, domain as string);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "google-pagespeed") {
      // Test the API key by making a simple PageSpeed request
      const testUrl = "https://www.google.com";
      const testRes = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${testUrl}&category=performance&strategy=mobile&key=${apiToken}`
      );
      if (!testRes.ok) {
        const body = await testRes.text();
        const message = `PageSpeed API key validation failed (${testRes.status}): ${body.substring(0, 200)}`;
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: Invalid API key or PageSpeed Insights API not enabled`, 400);
      }
    } else if (integration.slug === "mixpanel") {
      const { serviceAccountUser, projectId } = result.data;
      if (!serviceAccountUser || !projectId) {
        return apiError("Service Account Username and Project ID are required for Mixpanel", 400);
      }
      const { MixpanelService } = await import("@/lib/services/mixpanel");
      const svc = new MixpanelService(serviceAccountUser, apiToken, projectId);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "instagram") {
      const { InstagramService } = await import("@/lib/services/instagram");
      const svc = new InstagramService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "x-twitter") {
      const { XTwitterService } = await import("@/lib/services/x-twitter");
      const svc = new XTwitterService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "facebook") {
      const { FacebookService } = await import("@/lib/services/facebook");
      const svc = new FacebookService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "linkedin") {
      const { LinkedInService } = await import("@/lib/services/linkedin");
      const svc = new LinkedInService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "tiktok") {
      const { TikTokService } = await import("@/lib/services/tiktok");
      const svc = new TikTokService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "youtube") {
      const { YouTubeService } = await import("@/lib/services/youtube");
      const svc = new YouTubeService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "pinterest") {
      const { PinterestService } = await import("@/lib/services/pinterest");
      const svc = new PinterestService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "connect",
            status: "error",
            details: message,
          },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "openai") {
      // Test OpenAI API key by listing models
      const testRes = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!testRes.ok) {
        const message = `OpenAI API key validation failed (${testRes.status})`;
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: Invalid API key`, 400);
      }
    } else if (integration.slug === "anthropic") {
      // Test Anthropic API key with a minimal request
      const testRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiToken,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (!testRes.ok && testRes.status === 401) {
        const message = `Anthropic API key validation failed (${testRes.status})`;
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: Invalid API key`, 400);
      }
    } else if (integration.slug === "grok-xai") {
      // Test xAI API key
      const testRes = await fetch("https://api.x.ai/v1/models", {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!testRes.ok) {
        const message = `xAI API key validation failed (${testRes.status})`;
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: Invalid API key`, 400);
      }
    } else if (integration.slug === "meta-llama") {
      // Meta Llama API access varies by provider — store key without validation
      // The key may be used with various Llama hosting providers
    } else if (integration.slug === "elevenlabs") {
      const { ElevenLabsService } = await import("@/lib/services/elevenlabs");
      const svc = new ElevenLabsService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "stability-ai") {
      const { StabilityAIService } = await import("@/lib/services/stability-ai");
      const svc = new StabilityAIService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "runway") {
      const { RunwayService } = await import("@/lib/services/runway");
      const svc = new RunwayService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "replicate") {
      const { ReplicateService } = await import("@/lib/services/replicate");
      const svc = new ReplicateService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "gamma") {
      const { GammaService } = await import("@/lib/services/gamma");
      const svc = new GammaService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    } else if (integration.slug === "heygen") {
      const { HeyGenService } = await import("@/lib/services/heygen");
      const svc = new HeyGenService(apiToken);
      try {
        await svc.testConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        await prisma.integrationSyncLog.create({
          data: { integrationId: id, action: "connect", status: "error", details: message },
        });
        return apiError(`Connection test failed: ${message}`, 400);
      }
    }

    // Encrypt and store credentials — include extra fields for integrations that need them
    const credentialPayload = integration.slug === "gorgias"
      ? { apiToken, domain: result.data.domain, email: result.data.email }
      : integration.slug === "plaud"
      ? { apiToken, region: result.data.region || "us" }
      : integration.slug === "trello"
      ? { apiKey: result.data.apiKey, apiToken }
      : integration.slug === "jira"
      ? { apiToken, domain: result.data.domain, email: result.data.email }
      : integration.slug === "salesforce"
      ? { apiToken, domain: result.data.domain }
      : integration.slug === "mixpanel"
      ? { apiToken, serviceAccountUser: result.data.serviceAccountUser, serviceAccountSecret: apiToken, projectId: result.data.projectId }
      : { apiToken };
    const encrypted = encrypt(JSON.stringify(credentialPayload));
    const updated = await prisma.integration.update({
      where: { id },
      data: {
        credentials: encrypted,
        status: "CONNECTED",
        connectedAt: new Date(),
        lastSyncError: null,
      },
    });

    // Log success
    await prisma.integrationSyncLog.create({
      data: {
        integrationId: id,
        action: "connect",
        status: "success",
        details: "Connection established successfully",
      },
    });

    return apiSuccess({
      id: updated.id,
      status: updated.status,
      connectedAt: updated.connectedAt,
    });
  } catch (e) {
    console.error("POST /api/integrations/[id]/connect error:", e);
    return apiError("Failed to connect integration", 500);
  }
}

// Disconnect
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await prisma.integration.update({
      where: { id },
      data: {
        credentials: null,
        status: "AVAILABLE",
        connectedAt: null,
        lastSyncAt: null,
        lastSyncError: null,
      },
    });

    await prisma.integrationSyncLog.create({
      data: {
        integrationId: id,
        action: "disconnect",
        status: "success",
        details: "Integration disconnected",
      },
    });

    return apiSuccess({ id: updated.id, status: updated.status });
  } catch (e) {
    console.error("DELETE /api/integrations/[id]/connect error:", e);
    return apiError("Failed to disconnect integration", 500);
  }
}
