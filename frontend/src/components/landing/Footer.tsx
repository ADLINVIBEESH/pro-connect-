import { Zap, Twitter, Linkedin, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#05070b] text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="mb-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                <Zap className="h-5 w-5 text-secondary-foreground" />
              </div>
              <span className="text-xl font-display font-bold">ProConnect</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/55">
              The professional marketplace where businesses meet world-class freelance talent.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">Platform</h4>
            <ul className="space-y-2.5">
              {["Find Talent", "Find Work", "How It Works", "Pricing"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-white/50 transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">Company</h4>
            <ul className="space-y-2.5">
              {["About", "Blog", "Privacy", "Terms"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-white/50 transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/35">© 2026 ProConnect. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {[Twitter, Linkedin, Github].map((Icon, index) => (
              <a
                key={index}
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10"
              >
                <Icon className="h-4 w-4 text-white/50 hover:text-white" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
