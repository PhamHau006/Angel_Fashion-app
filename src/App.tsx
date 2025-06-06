
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./components/Home/HomePage";
import { LoginForm } from "./components/Auth/LoginForm";
import { ShopPage } from "./components/Shop/ShopPage";
import { ProductDetailPage } from "./components/Product/ProductDetailPage";
import { CartPage } from "./components/Cart/CartPage";
import { CheckoutPage } from "./components/Checkout/CheckoutPage";
import { MessengerPage } from "./components/Messenger/MessengerPage";
import { ProfilePage } from "./components/Profile/ProfilePage";
import { SettingsPage } from "./components/Settings/SettingsPage";
import { LuckyWheelPage } from "./components/LuckyWheel/LuckyWheelPage";
import { AIChatPage } from "./components/AI/AIChatPage";
import { AITryOnPage } from "./components/AI/AITryOnPage";
import { OrdersPage } from "./components/Orders/OrdersPage";
import { FavoritesPage } from "./components/Favorites/FavoritesPage";
import { RegisterForm } from "./components/Auth/RegisterForm";
import { SharedCartPage } from "./components/Cart/SharedCartPage";
import NotFound from "./pages/NotFound";
import { ComboPage } from "./components/Combo/ComboPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/combo" element={<ComboPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/combo/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/shared-cart" element={<SharedCartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/messenger" element={<MessengerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/payment-info" element={<div>Payment Info - Coming Soon</div>} />
          <Route path="/addresses" element={<div>Addresses - Coming Soon</div>} />
          <Route path="/notifications" element={<div>Notifications - Coming Soon</div>} />
          <Route path="/edit-profile" element={<div>Edit Profile - Coming Soon</div>} />
          <Route path="/privacy" element={<div>Privacy - Coming Soon</div>} />
          <Route path="/language" element={<div>Language - Coming Soon</div>} />
          <Route path="/help" element={<div>Help - Coming Soon</div>} />
          <Route path="/lucky-wheel" element={<LuckyWheelPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/ai-tryon" element={<AITryOnPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
