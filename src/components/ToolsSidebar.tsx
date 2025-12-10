'use client'
import Link from "next/link";
import { getLinkHref } from "~/configs/buildLink";
import { useCommonContext } from "~/context/common-context";

interface ToolsSidebarProps {
  locale: string;
  currentToolSlug?: string;
}

const ToolsSidebar = ({ locale, currentToolSlug }: ToolsSidebarProps) => {
  const { toolsListText, setShowLoadingModal } = useCommonContext();

  const tools = [
    {
      name: toolsListText.vocalRemover,
      slug: 'vocal-remover',
      emoji: '🎤',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      name: toolsListText.audioSplitter,
      slug: 'audio-splitter',
      emoji: '🎚️',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      name: toolsListText.audioCutter,
      slug: 'audio-cutter',
      emoji: '✂️',
      gradient: 'from-red-500 to-red-600'
    },
    {
      name: toolsListText.karaokeMaker,
      slug: 'karaoke-maker',
      emoji: '🎵',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      name: toolsListText.extractVocals,
      slug: 'extract-vocals',
      emoji: '🎙️',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      name: toolsListText.acapellaMaker,
      slug: 'acapella-maker',
      emoji: '🎶',
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      name: toolsListText.noiseReducer,
      slug: 'noise-reducer',
      emoji: '🔇',
      gradient: 'from-green-500 to-green-600'
    },
  ];

  const handleToolClick = (slug: string) => {
    if (currentToolSlug !== slug) {
      setShowLoadingModal(true);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 min-h-screen sticky top-16 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">
          Audio Tools
        </h2>
        <nav className="space-y-2">
          {tools.map((tool) => {
            const isActive = currentToolSlug === tool.slug;
            return (
              <Link
                key={tool.slug}
                href={getLinkHref(locale, `tools/${tool.slug}`)}
                onClick={() => handleToolClick(tool.slug)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-brand-600'
                }`}
              >
                {/* Icon with gradient background */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center`}>
                  <span className="text-xl">{tool.emoji}</span>
                </div>
                
                {/* Tool name */}
                <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {tool.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* All Tools Link */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <Link
            href={getLinkHref(locale, 'tools')}
            onClick={() => setShowLoadingModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <span>View All Tools</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default ToolsSidebar;

