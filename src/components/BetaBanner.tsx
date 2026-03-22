// BetaBanner — displayed under the masthead title on every news publication page.
export default function BetaBanner() {
  return (
    <div className="mt-2">
      <h2 className="font-sans text-[10px] font-bold uppercase tracking-widest text-mercury-accent text-center">
        Always Last.. To Break News.. #Beta
      </h2>
      <p className="text-[10px] text-mercury-muted font-sans text-center mt-0.5">
        Mercury Local is in public beta — independent, locally owned, and just getting started.
      </p>
    </div>
  );
}
