import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MessageCircle, Phone, Mail, FileQuestion, Users, CreditCard, Shield } from "lucide-react";
import { useState } from "react";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { icon: Users, title: "Getting Started", description: "New to HozaTask? Start here" },
    { icon: FileQuestion, title: "Bookings", description: "Manage your bookings and projects" },
    { icon: CreditCard, title: "Payments", description: "Billing, refunds, and pricing" },
    { icon: Shield, title: "Safety & Trust", description: "Our verification process" },
  ];

  const faqs = [
    {
      question: "How do I post a project?",
      answer: "Click 'Get Quotes' on the homepage, describe your project, and you'll receive quotes from qualified pros in your area. It's free to post and compare quotes.",
    },
    {
      question: "How are pros verified?",
      answer: "All pros go through our verification process which includes identity verification, background checks, and skill assessments. Look for the verification badge on pro profiles.",
    },
    {
      question: "What if I'm not satisfied with the service?",
      answer: "Contact us within 48 hours of service completion. We have a satisfaction guarantee and will work with you to resolve any issues.",
    },
    {
      question: "How do payments work?",
      answer: "Payments are made directly to the pro after the service is completed. We support various payment methods including card payments and bank transfers.",
    },
    {
      question: "Can I cancel a booking?",
      answer: "Yes, you can cancel a booking through your account. Cancellation policies vary by pro, so check the terms before booking.",
    },
    {
      question: "How do I become a pro on HozaTask?",
      answer: "Click 'Become a Pro' and complete the application. You'll need to provide your business details, services offered, and go through our verification process.",
    },
    {
      question: "How do credits work for pros?",
      answer: "Pros use credits to respond to customer leads. Credits can be purchased in packages, and the cost per lead varies by job type and location.",
    },
    {
      question: "Is my personal information safe?",
      answer: "Yes, we take data security seriously. Your information is encrypted and we never share your details without your consent.",
    },
  ];

  const filteredFaqs = faqs.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">How can we help?</h1>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                className="pl-12 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-2">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="bg-background rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filteredFaqs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No results found. Try a different search term.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">Still need help?</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">Chat with our support team</p>
                  <Button variant="outline" size="sm">Start Chat</Button>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">support@hozatask.com</p>
                  <Button variant="outline" size="sm">Send Email</Button>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="text-sm text-muted-foreground mb-4">Mon-Fri, 9am-5pm</p>
                  <Button variant="outline" size="sm">Call Us</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Help;