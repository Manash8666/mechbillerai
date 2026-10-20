import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PortalClientView from './PortalClientView';

interface PortalPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function TenantPortalPage({ params }: PortalPageProps) {
  const { subdomain } = await params;
  const cleanSubdomain = (subdomain || '').toLowerCase().trim();

  // Find workshop tenant by unique subdomain
  const workshop = await prisma.user.findFirst({
    where: {
      subdomain: cleanSubdomain,
    },
    include: {
      branding: true,
    },
  });

  if (!workshop) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl font-bold mb-4">
          ⚠️
        </div>
        <h1 className="text-2xl font-extrabold mb-2">Workshop Subdomain Not Found</h1>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          No registered garage is associated with <span className="text-amber-400 font-mono font-semibold">{cleanSubdomain}.motoban.in</span>.
        </p>
        <a
          href="https://motoban.in"
          className="px-5 py-2.5 bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg hover:bg-amber-300 transition-colors"
        >
          Return to MotoBan Home
        </a>
      </div>
    );
  }

  const tenantData = {
    userId: workshop.id,
    garageName: workshop.branding?.garageName || workshop.name || 'MotoBan Certified Garage',
    logoUrl: workshop.branding?.logoUrl || null,
    primaryColor: workshop.branding?.primaryColor || '#E5C07B',
    phone: workshop.phone || '',
    email: workshop.email,
    subdomain: cleanSubdomain,
    garageType: workshop.garageType,
  };

  return <PortalClientView tenant={tenantData} />;
}
