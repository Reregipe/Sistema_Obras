import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  subject: string;
  tipo: 'urgente' | 'atrasado' | 'info' | 'alerta';
  titulo: string;
  mensagem: string;
  etapa?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, tipo, titulo, mensagem, etapa }: NotificationEmailRequest = await req.json();

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'urgente': return '#ef4444';
        case 'atrasado': return '#f97316';
        case 'alerta': return '#f59e0b';
        default: return '#3b82f6';
      }
    };

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'urgente': return 'URGENTE';
        case 'atrasado': return 'ATRASADO';
        case 'alerta': return 'ALERTA';
        default: return 'INFORMAÇÃO';
      }
    };

    const emailResponse = await resend.emails.send({
      from: "Sistema de Gestão <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: ${getTypeColor(tipo)}; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">
                          ${getTypeLabel(tipo)}
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px;">
                        <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">
                          ${titulo}
                        </h2>
                        <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.5;">
                          ${mensagem}
                        </p>
                        ${etapa ? `
                          <div style="background-color: #f4f4f5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                            <p style="margin: 0; color: #71717a; font-size: 14px;">
                              <strong>Etapa:</strong> ${etapa}
                            </p>
                          </div>
                        ` : ''}
                        <p style="margin: 0; color: #71717a; font-size: 14px;">
                          Acesse o sistema para mais detalhes e tomar as ações necessárias.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f4f4f5; padding: 20px; text-align: center;">
                        <p style="margin: 0; color: #71717a; font-size: 12px;">
                          Sistema de Gestão de Obras - Energisa MT
                        </p>
                        <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 12px;">
                          Este é um email automático, não responda.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
