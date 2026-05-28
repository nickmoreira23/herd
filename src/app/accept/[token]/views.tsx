import type { InvitationStatus } from "@prisma/client";
import Link from "next/link";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center text-foreground">
        {children}
      </div>
    </div>
  );
}

export function InvitationNotFoundView() {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Convite não encontrado</h1>
      <p className="text-gray-500 mb-6">
        Este link de convite não é válido ou já foi removido.
      </p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        Ir para a home
      </Link>
    </Card>
  );
}

export function InvitationExpiredView() {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Convite expirado</h1>
      <p className="text-gray-500 mb-6">
        Este convite expirou. Solicite um novo convite ao administrador da organização.
      </p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        Ir para a home
      </Link>
    </Card>
  );
}

export function InvitationAlreadyProcessedView({
  status,
}: {
  status: InvitationStatus;
}) {
  const messages: Record<InvitationStatus, string> = {
    ACCEPTED: "Este convite já foi aceito.",
    DECLINED: "Este convite foi recusado.",
    EXPIRED: "Este convite expirou.",
    PENDING: "",
  };

  return (
    <Card>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Convite indisponível</h1>
      <p className="text-gray-500 mb-6">{messages[status]}</p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        Ir para a home
      </Link>
    </Card>
  );
}
