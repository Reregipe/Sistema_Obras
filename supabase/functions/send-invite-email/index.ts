import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  token: string;
  roles: string[];
}

const roleNames: Record<string, string> = {
  ADMIN: "Administrador",
  ADM: "Administrativo",
  GESTOR: "Gestor",
  OPER: "Operacional",
  FIN: "Financeiro",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invite-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, roles }: InviteEmailRequest = await req.json();
    console.log("Processing invite for:", email);

    if (!email || !token || !roles || roles.length === 0) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Build invite URL
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || "";
    const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

    // Format roles list
    const rolesList = roles.map((r) => roleNames[r] || r).join(", ");

    const emailResponse = await resend.emails.send({
      from: "EngElétrica <onboarding@resend.dev>",
      to: [email],
      subject: "Você foi convidado para o Sistema EngElétrica",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .roles { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Bem-vindo!</h1>
              </div>
              <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Você foi convidado para acessar o Sistema EngElétrica</h2>
                <p>Você recebeu um convite para fazer parte da nossa equipe no sistema de gerenciamento de obras.</p>
                
                <div class="roles">
                  <strong>Suas permissões:</strong><br>
                  ${rolesList}
                </div>

                <p>Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
                
                <div style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Aceitar Convite</a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                  Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este email com segurança.
                </p>
              </div>
              <div class="footer">
                <p>Sistema EngElétrica - Gerenciamento de Obras<br>
                Este é um email automático, por favor não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
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
