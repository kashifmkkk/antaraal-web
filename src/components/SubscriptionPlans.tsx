import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SubscriptionPlans = () => {
  const { toast } = useToast();
  const plans = [
    {
      name: "Starter",
      icon: Zap,
      price: "₹15,000",
      period: "/month",
      description: "Perfect for small businesses starting their aerospace journey",
      popular: false,
      features: [
        "Up to 100 product listings",
        "Basic RFQ management",
        "Email support",
        "Standard warranty tracking",
        "Basic vendor communication",
        "Monthly analytics reports"
      ],
      limits: {
        listings: "100",
        rfqs: "50/month",
        vendors: "20"
      }
    },
    {
      name: "Professional",
      icon: Star,
      price: "₹35,000",
      period: "/month",
      description: "Advanced features for growing aerospace businesses",
      popular: true,
      features: [
        "Up to 500 product listings",
        "Advanced RFQ & auction system",
        "Priority support",
        "Advanced warranty alerts",
        "Multi-vendor negotiations",
        "Weekly analytics & insights",
        "Custom complaint workflows",
        "API access"
      ],
      limits: {
        listings: "500",
        rfqs: "200/month",
        vendors: "100"
      }
    },
    {
      name: "Enterprise",
      icon: Crown,
      price: "₹75,000",
      period: "/month",
      description: "Complete solution for large aerospace organizations",
      popular: false,
      features: [
        "Unlimited product listings",
        "Full auction & trading platform",
        "24/7 dedicated support",
        "AI-powered warranty optimization",
        "Enterprise vendor management",
        "Real-time analytics dashboard",
        "Custom integration support",
        "White-label options",
        "Dedicated account manager"
      ],
      limits: {
        listings: "Unlimited",
        rfqs: "Unlimited",
        vendors: "Unlimited"
      }
    }
  ];

  return (
    <section className="py-10 sm:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect subscription plan for your aerospace business needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={index} 
                className={`relative hover:shadow-card transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-primary shadow-elegant' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-warning text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.popular ? 'bg-gradient-to-r from-primary to-warning' : 'bg-muted'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${
                        plan.popular ? 'text-primary-foreground' : 'text-foreground'
                      }`} />
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  
                  <div className="text-center">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Key Limits */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Product Listings:</span>
                      <span className="font-semibold">{plan.limits.listings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">RFQs:</span>
                      <span className="font-semibold">{plan.limits.rfqs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vendor Connections:</span>
                      <span className="font-semibold">{plan.limits.vendors}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary to-warning hover:shadow-elegant' 
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => toast({
                      title: `${plan.name} Plan Selected`,
                      description: `Starting your ${plan.name} subscription at ${plan.price}${plan.period}. Redirecting to payment...`,
                    })}
                  >
                    {plan.popular ? 'Get Started' : 'Choose Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground">
            All plans include secure payments, SSL encryption, and data backup
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toast({
                title: "Feature Comparison",
                description: "Loading detailed feature comparison table...",
              })}
            >
              Compare Features
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toast({
                title: "Contact Sales",
                description: "Our sales team will contact you within 24 hours for custom pricing.",
              })}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;