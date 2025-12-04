import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">HozaTask</h3>
            <p className="text-sm text-background/80">
              Your trusted marketplace for everyday tasks and services
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">For Customers</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><Link to="/browse" className="hover:text-background transition-colors">Browse Services</Link></li>
              <li><Link to="/my-account" className="hover:text-background transition-colors">My Account</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">For Taskers</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><Link to="/auth" className="hover:text-background transition-colors">Sign Up</Link></li>
              <li><Link to="/supplier-submission" className="hover:text-background transition-colors">List a Service</Link></li>
              <li><Link to="/supplier-dashboard" className="hover:text-background transition-colors">My Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-background/20 text-sm text-background/80 text-center">
          <p>© 2024 HozaTask. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
