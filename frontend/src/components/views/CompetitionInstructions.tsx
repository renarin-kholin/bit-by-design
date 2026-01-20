import { toast } from "react-hot-toast";
import { Button, Modal } from "../ui";
import { ArrowRightIcon } from "../icons";

const FIGMA_LINK = "https://www.figma.com/community/file/1591156167480577666/bit-by-design-template";

interface CompetitionInstructionsContentProps {
  onCopyLink: () => void;
}

function CompetitionInstructionsContent({ onCopyLink }: CompetitionInstructionsContentProps) {
  return (
    <div className="flex flex-col gap-6 text-center sm:text-left">
      <h3 className="font-['Figtree',sans-serif] font-semibold text-xl sm:text-2xl text-black tracking-tight text-center mb-2">
        Submission Guidelines (Quick Rules)
      </h3>
      
      <div className="space-y-6 text-sm sm:text-base text-black/60 font-['Figtree',sans-serif] leading-relaxed">
        <div className="flex flex-col gap-4 text-left">
          <p>
            1. <span className="text-black font-medium">Individual Competition:</span> This is an individual competition. Only one submission per participant is allowed. All designs must be created during the event timeframe.
          </p>
          <p>
            2. <span className="text-black font-medium">Use the Template:</span> Participants must use the official Figma template provided. You may freely customize colors, typography, and visual details.
          </p>
          <p>
             However, please <span className="text-black font-bold underline underline-offset-4 decoration-[#ef4444]">do not change the dimensions</span> of the main frame or fixed elements in the template.
          </p>
          <p>
            3. <span className="text-black font-medium">Submit Your Work:</span> Submit a Figma design link with view access enabled.
          </p>
        </div>
        
        <p className="italic text-black/40 border-t border-black/10 pt-4 text-center">
          Once submitted, designs cannot be edited after the submission window closes.
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <Button 
          variant="primary" 
          className="w-auto px-10 h-11 group gap-3"
          onClick={onCopyLink}
        >
          Copy Template Link
          <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}

export function CompetitionInstructionsButton({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="mt-8 text-white/50 hover:text-white transition-colors text-sm font-medium font-['Figtree',sans-serif] flex items-center gap-2 group"
    >
      <span className="w-5 h-5 rounded-full border border-white/30 group-hover:border-white/80 flex items-center justify-center text-[10px] transition-colors">i</span>
      Competition Guidelines
    </button>
  );
}

export function CompetitionInstructionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(FIGMA_LINK);
    toast.success("Template link copied to clipboard!");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="p-6 sm:p-10">
       <CompetitionInstructionsContent onCopyLink={handleCopyLink} />
    </Modal>
  );
}