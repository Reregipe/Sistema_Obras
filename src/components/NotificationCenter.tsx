import { useState, useEffect } from "react";
import { Bell, X, CheckCircle2, AlertCircle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
// Supabase removido
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Notification {
  id_notificacao: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  etapa: string | null;
  lida: boolean;
  criado_em: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Dados mocados/local: ajuste conforme integração futura
    setTimeout(() => {
      setNotifications([]);
      setUnreadCount(0);
    }, 500);
  }, []);

  // loadNotifications removido (dados mocados)

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id_notificacao === id ? { ...n, lida: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    setUnreadCount(0);
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'urgente':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'atrasado':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'urgente':
        return 'bg-destructive/10 border-destructive/20';
      case 'atrasado':
        return 'bg-warning/10 border-warning/20';
      case 'info':
        return 'bg-primary/10 border-primary/20';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center animate-pulse"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id_notificacao}
                  className={cn(
                    "p-3 mb-2 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                    getTypeColor(notification.tipo),
                    !notification.lida && "border-l-4"
                  )}
                  onClick={() => {
                    markAsRead(notification.id_notificacao);
                    setOpen(false);
                    if (notification.etapa) {
                      // Navigate based on etapa
                      if (notification.etapa.includes('Acionamento')) navigate('/acionamentos');
                      else if (notification.etapa.includes('Obra')) navigate('/obras');
                      else if (notification.etapa.includes('Medição')) navigate('/medicoes');
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.tipo)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{notification.titulo}</p>
                        {!notification.lida && (
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {notification.mensagem}
                      </p>
                      {notification.etapa && (
                        <Badge variant="outline" className="text-xs">
                          {notification.etapa}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.criado_em).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
