import React from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  HelpCircle, 
  FileText, 
  RefreshCw, 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Lock,
  Truck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const InstitutionalPages: React.FC = () => {
  const { selectedInstitutionalTopic, setSelectedInstitutionalTopic, setCurrentView } = useStore();

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb */}
      <button
        onClick={() => setCurrentView('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white group transition"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar para a Loja</span>
      </button>

      {/* Navigation Pills */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-2">
        {[
          { id: 'sobre', label: 'Sobre a Pulsar', icon: Sparkles },
          { id: 'como-funciona', label: 'Como Funciona NFC', icon: Wifi },
          { id: 'privacidade', label: 'Privacidade & LGPD', icon: Lock },
          { id: 'termos', label: 'Termos de Uso', icon: FileText },
          { id: 'trocas', label: 'Trocas e Devoluções', icon: RefreshCw }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = selectedInstitutionalTopic === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedInstitutionalTopic(item.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-2 transition ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black shadow-lg shadow-[#FF5500]/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="p-8 rounded-3xl bg-[#14141B] border border-white/10 space-y-6 text-slate-300 text-sm leading-relaxed">
        {selectedInstitutionalTopic === 'sobre' && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-[#FFAA00] uppercase tracking-wider">Institucional</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Sobre a Pulsar Tecnologia</h1>
              <p className="text-xs text-slate-400 mt-1">Tecnologia que impulsiona o crescimento do seu negócio local</p>
            </div>

            <p>
              A <strong>Pulsar Tecnologia</strong> nasceu com um propósito claro: eliminar o atrito entre a satisfação do cliente no mundo físico e a reputação digital das empresas no Google.
            </p>

            <p>
              Em um mercado onde mais de 92% dos consumidores consultam as avaliações no Google Meu Negócio antes de visitar um restaurante, clínica, oficina mecânica ou loja, estar entre os primeiros com nota 5 estrelas é o fator mais determinante para o faturamento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF5500]/20 text-[#FFAA00] flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold text-white text-base">Inovação Ativa</h4>
                <p className="text-xs text-slate-400">
                  Hardware inteligente com chips NTAG213/215 de resposta instantânea e acrílico de alta densidade.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF5500]/20 text-[#FFAA00] flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold text-white text-base">Impulso Real</h4>
                <p className="text-xs text-slate-400">
                  Foco absoluto em acelerar a autoridade orgânica e o ranking local das empresas parceiras.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF5500]/20 text-[#FFAA00] flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-bold text-white text-base">Confiabilidade</h4>
                <p className="text-xs text-slate-400">
                  Garantia de 1 ano contra qualquer falha, suporte humanizado e envio rápido para todo o Brasil.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#181820] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-xs block">Dúvidas ou Projetos Especiais?</span>
                <span className="text-[11px] text-slate-400">Atendimento consultivo direto pelo WhatsApp para empresas e franquias</span>
              </div>
              <a
                href="https://wa.me/5511999998888?text=Olá!%20Gostaria%20de%20falar%20com%20um%20consultor%20da%20Pulsar%20Tecnologia"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition whitespace-nowrap shadow"
              >
                Falar com Consultor
              </a>
            </div>
          </div>
        )}

        {selectedInstitutionalTopic === 'como-funciona' && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-[#FFAA00] uppercase tracking-wider">Guia Tecnológico</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Como Funciona a Tecnologia NFC</h1>
              <p className="text-xs text-slate-400 mt-1">Entenda a mágica que ocorre em menos de 2 segundos</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5500]/20 text-[#FFAA00] flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Aproximação sem Fio (NFC)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    A tecnologia Near Field Communication (NFC) opera por indução eletromagnética em 13.56 MHz. Quando o cliente aproxima a parte superior do celular (onde fica a antena), a placa transmite o link seguro do seu Google Meu Negócio sem necessitar de energia elétrica própria.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5500]/20 text-[#FFAA00] flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Abertura Automática da Tela de Avaliação</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    O link oficial gravado na placa dispara diretamente a janela nativa do Google com as 5 estrelas selecionáveis, permitindo que o cliente comente e avalie na hora, antes mesmo de pagar a conta ou sair do balcão.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5500]/20 text-[#FFAA00] flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">QR Code Dinâmico de Backup</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Para modelos antigos de smartphones ou clientes que preferem a câmera fotográfica, a placa possui QR Code com contraste ultra-nítido com link espelhado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedInstitutionalTopic === 'privacidade' && (
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-[#FFAA00] uppercase tracking-wider">Segurança & Conformidade</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Política de Privacidade (LGPD)</h1>
            </div>
            <p className="text-xs">
              A Pulsar Tecnologia respeita rigorosamente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Coletamos exclusivamente os dados necessários para faturamento, emissão de nota fiscal e despacho de encomendas pelas transportadoras credenciadas.
            </p>
            <p className="text-xs">
              Não comercializamos nem compartilhamos seus dados com terceiros para fins publicitários.
            </p>
          </div>
        )}

        {selectedInstitutionalTopic === 'termos' && (
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-[#FFAA00] uppercase tracking-wider">Regulamento</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Termos de Uso</h1>
            </div>
            <p className="text-xs">
              Ao adquirir nossos produtos físicos de avaliação e displays tecnológicos, o cliente declara estar de posse legal do perfil do Google Meu Negócio cadastrado ou possuir autorização expressa para direcionamento ao mesmo.
            </p>
          </div>
        )}

        {selectedInstitutionalTopic === 'trocas' && (
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-[#FFAA00] uppercase tracking-wider">Satisfação Garantida</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Política de Trocas e Devoluções</h1>
            </div>
            <p className="text-xs">
              Conforme o Artigo 49 do Código de Defesa do Consumidor, o cliente tem até 7 dias corridos após o recebimento para solicitar a devolução por arrependimento.
            </p>
            <p className="text-xs">
              Além disso, a Pulsar oferece <strong>1 ano de garantia total</strong> para substituição imediata em caso de defeito no chip NFC ou falha de fabricação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
