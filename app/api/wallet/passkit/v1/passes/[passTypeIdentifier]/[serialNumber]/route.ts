import { prisma } from '@/lib/db';
import { authorizePasskitRequest, passkitPassTypeId } from '@/lib/wallet/passkit-request';
import { walletPassResponse } from '@/lib/wallet/pass-response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: { passTypeIdentifier: string; serialNumber: string } };

export async function GET(request: Request, { params }: Params) {
  if (params.passTypeIdentifier !== passkitPassTypeId()) {
    return new Response(null, { status: 404 });
  }

  if (!(await authorizePasskitRequest(params.serialNumber, request))) {
    return new Response(null, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.serialNumber } });
  if (!ticket) {
    return new Response(null, { status: 404 });
  }

  const ifModifiedSince = request.headers.get('if-modified-since');
  return walletPassResponse(ticket, ifModifiedSince);
}
