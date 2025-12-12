import { Link, useNavigate } from "react-router-dom";
import { Facebook, Youtube, MessageCircle } from "lucide-react";

export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        {/* Brand and Tagline */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2">HozaTask</h3>
          <p className="text-secondary-foreground/80">Consider it done.</p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Company */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider opacity-60">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/press" className="hover:text-primary transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customers */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider opacity-60">Customers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/post-project" className="hover:text-primary transition-colors">
                  How to use HozaTask
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-primary transition-colors">
                  Sign up
                </Link>
              </li>
              <li>
                <Link to="/pros" className="hover:text-primary transition-colors">
                  Services near me
                </Link>
              </li>
              <li>
                <Link to="/cost-guides" className="hover:text-primary transition-colors">
                  Cost estimates
                </Link>
              </li>
            </ul>
          </div>

          {/* Pros */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider opacity-60">Pros</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/become-pro" className="hover:text-primary transition-colors">
                  HozaTask for pros
                </Link>
              </li>
              <li>
                <Link to="/become-pro" className="hover:text-primary transition-colors">
                  Sign up as a pro
                </Link>
              </li>
              <li>
                <Link to="/pro-dashboard" className="hover:text-primary transition-colors">
                  Pro resources
                </Link>
              </li>
              <li>
                <Link to="/buy-credits" className="hover:text-primary transition-colors">
                  Buy credits
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider opacity-60">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="hover:text-primary transition-colors">
                  Help
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-primary transition-colors">
                  Safety
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-4 mb-8">
          <a 
            href="https://wa.link/zi7vvj" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="WhatsApp"
          >
            <MessageCircle size={20} />
          </a>
          <a 
            href="https://www.facebook.com/hozatask" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Facebook"
          >
            <Facebook size={20} />
          </a>
          <a 
            href="https://www.youtube.com/@hozatask" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="YouTube"
          >
            <Youtube size={20} />
          </a>
          <a 
            href="https://www.tiktok.com/@hozatasks" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="TikTok"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-secondary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-60">
          <p>© {currentYear} HozaTask. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/guarantee" className="hover:text-primary transition-colors">
              HozaTask Guarantee
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
