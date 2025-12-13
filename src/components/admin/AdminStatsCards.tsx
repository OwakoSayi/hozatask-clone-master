import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CalendarCheck, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface StatsCardsProps {
  totalUsers: number;
  totalSuppliers: number;
  activeSuppliers: number;
  pendingSuppliers: number;
  totalBookings: number;
  completedBookings: number;
  totalProjects: number;
  openProjects: number;
}

const AdminStatsCards = ({
  totalUsers,
  totalSuppliers,
  activeSuppliers,
  pendingSuppliers,
  totalBookings,
  completedBookings,
  totalProjects,
  openProjects,
}: StatsCardsProps) => {
  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      description: "Registered users",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Suppliers",
      value: totalSuppliers,
      icon: Building2,
      description: `${activeSuppliers} active, ${pendingSuppliers} pending`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: CalendarCheck,
      description: `${completedBookings} completed`,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Project Requests",
      value: totalProjects,
      icon: TrendingUp,
      description: `${openProjects} open`,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStatsCards;
