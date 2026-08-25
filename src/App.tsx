import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Bell,
  Building2,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { CompanyProfile, Contract, ContractCategory, ContractStatus } from './types';
import { INITIAL_CONTRACTS, DEFAULT_COMPANY_PROFILE } from './data/initialContracts';
import { isExpiringSoon, isNoticeDeadlineApproaching } from './utils/contractUtils';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { ContractTable } from './components/ContractTable';
import { ContractAlerts } from './components/ContractAlerts';
import { AddContractModal } from './components/AddContractModal';
import { ContractDetailModal } from './components/ContractDetailModal';
import { LetterGeneratorModal } from './components/LetterGeneratorModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { EarlyAccessBanner } from './components/EarlyAccessBanner';

const CONTRACTS_STORAGE_KEY = 'b2b_contracts_app_data_v2';
const PROFILE_STORAGE_KEY = 'b2b_company_profile_data_v2';

export default function App() {
  // Contracts State
  const [contracts, setContracts] = useState<Contract[]>(() => {
    try {
      const saved = localStorage.getItem(CONTRACTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading contracts from localStorage:', e);
    }
    return INITIAL_CONTRACTS;
  });

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading company profile:', e);
    }
    return DEFAULT_COMPANY_PROFILE;
  });

  // Navigation & UI State
  const [activeView, setActiveView] = useState<'dashboard' | 'alerts'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<ContractCategory | 'all'>('all');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedContractForDetail, setSelectedContractForDetail] = useState<Contract | null>(
    null
  );
  const [selectedContractForLetter, setSelectedContractForLetter] = useState<Contract | null>(
    null
  );

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
    } catch (e) {
      console.error('Error saving contracts to localStorage:', e);
    }
  }, [contracts]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(companyProfile));
    } catch (e) {
      console.error('Error saving company profile to localStorage:', e);
    }
  }, [companyProfile]);

  // Keep selected contract in sync if updated
  useEffect(() => {
    if (selectedContractForDetail) {
      const updated = contracts.find((c) => c.id === selectedContractForDetail.id);
      if (updated) {
        setSelectedContractForDetail(updated);
      }
    }
  }, [contracts]);

  // Urgent alerts count (< 30 days)
  const urgentAlertCount = contracts.filter(
    (c) => isExpiringSoon(c) || isNoticeDeadlineApproaching(c)
  ).length;

  // Handlers
  const handleSaveContract = (newContract: Contract) => {
    setContracts((prev) => [newContract, ...prev]);
  };

  const handleUpdateStatus = (contractId: string, status: ContractStatus) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId) {
          const actionText =
            status === 'active'
              ? 'Statut réactivé / confirmé actif.'
              : status === 'watch'
              ? 'Statut basculé en "À surveiller".'
              : status === 'cancel_pending'
              ? 'Statut basculé en "À résilier".'
              : 'Contrat marqué comme résilié.';

          return {
            ...c,
            status,
            updatedAt: new Date().toISOString(),
            actions: [
              {
                id: `act-${Date.now()}`,
                date: new Date().toISOString(),
                type: 'status_changed',
                description: actionText,
              },
              ...(c.actions || []),
            ],
          };
        }
        return c;
      })
    );
  };

  const handleUpdateNotes = (contractId: string, notes: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId) {
          return {
            ...c,
            notes,
            updatedAt: new Date().toISOString(),
            actions: [
              {
                id: `act-${Date.now()}`,
                date: new Date().toISOString(),
                type: 'updated',
                description: 'Notes internes mises à jour.',
              },
              ...(c.actions || []),
            ],
          };
        }
        return c;
      })
    );
  };

  const handleDeleteContract = (contractId: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
    if (selectedContractForDetail?.id === contractId) {
      setSelectedContractForDetail(null);
    }
  };

  const handleLetterGenerated = (contractId: string, letterText: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId) {
          return {
            ...c,
            lastGeneratedLetter: letterText,
            status: c.status === 'active' ? 'cancel_pending' : c.status,
            updatedAt: new Date().toISOString(),
            actions: [
              {
                id: `act-${Date.now()}`,
                date: new Date().toISOString(),
                type: 'letter_generated',
                description: 'Lettre de résiliation formelle LRAR générée via IA.',
              },
              ...(c.actions || []),
            ],
          };
        }
        return c;
      })
    );
  };

  const handleOpenLetterGenerator = (contract: Contract) => {
    setSelectedContractForLetter(contract);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        companyProfile={companyProfile}
        alertCount={urgentAlertCount}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Early Access Waitlist Banner */}
        <EarlyAccessBanner
          companyName={companyProfile.companyName}
          contractsCount={contracts.length}
        />

        {activeView === 'dashboard' ? (
          <>
            {/* Dashboard KPI Stats & Filters */}
            <DashboardStats
              contracts={contracts}
              selectedCategory={selectedCategory}
              onSelectCategoryFilter={(cat) => setSelectedCategory(cat)}
              onNavigateToAlerts={() => setActiveView('alerts')}
            />

            {/* Main Contracts Data Table */}
            <ContractTable
              contracts={contracts}
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => setSelectedCategory(cat)}
              onSelectContract={(contract) => setSelectedContractForDetail(contract)}
              onGenerateLetter={handleOpenLetterGenerator}
              onDeleteContract={handleDeleteContract}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onUpdateStatus={handleUpdateStatus}
            />
          </>
        ) : (
          /* Dedicated Alerts View (< 30 days) */
          <ContractAlerts
            contracts={contracts}
            onSelectContract={(contract) => setSelectedContractForDetail(contract)}
            onGenerateLetter={handleOpenLetterGenerator}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.jpg" alt="Logo" className="w-5 h-5 rounded object-contain border border-gray-200" />
            <span className="font-semibold text-gray-800">ContratsPro B2B</span>
            <span>•</span>
            <span>Gestion de contrats fournisseurs &amp; conformité juridique française</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-400">
            <span>Loi Châtel &bull; Loi Hamon &bull; Code civil &bull; LRAR</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Add Contract Modal */}
      <AddContractModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveContract={handleSaveContract}
      />

      {/* 2. Contract Detail Sheet Modal */}
      <ContractDetailModal
        contract={selectedContractForDetail}
        isOpen={!!selectedContractForDetail}
        onClose={() => setSelectedContractForDetail(null)}
        onGenerateLetter={(contract) => {
          setSelectedContractForDetail(null);
          setSelectedContractForLetter(contract);
        }}
        onUpdateStatus={handleUpdateStatus}
        onUpdateNotes={handleUpdateNotes}
      />

      {/* 3. Termination Letter Generator Modal */}
      <LetterGeneratorModal
        contract={selectedContractForLetter}
        companyProfile={companyProfile}
        isOpen={!!selectedContractForLetter}
        onClose={() => setSelectedContractForLetter(null)}
        onLetterGenerated={handleLetterGenerated}
      />

      {/* 4. Company Profile Settings Modal */}
      <CompanySettingsModal
        companyProfile={companyProfile}
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSaveProfile={(profile) => setCompanyProfile(profile)}
      />
    </div>
  );
}
