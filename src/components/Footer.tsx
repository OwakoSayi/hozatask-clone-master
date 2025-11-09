export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">HozaTask</h3>
            <p className="text-sm text-background/80">
              Your trusted marketplace for everyday tasks and services
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">For Customers</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Browse Services</a></li>
              <li><a href="#" className="hover:text-background transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Trust & Safety</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Help Center</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">For Taskers</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Sign Up</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Tasker Requirements</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Earnings</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Resources</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-background/20 text-sm text-background/80 text-center">
          <p>© 2024 HozaTask. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
};
