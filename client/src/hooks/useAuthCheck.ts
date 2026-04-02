import { useEffect, useState } from "react";

export function useAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar se existe token no localStorage
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("auth_user");
    
    // Definir autenticação imediatamente
    if (token && user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []); // Executar apenas uma vez

  return isAuthenticated;
}
