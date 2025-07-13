import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./components/Home/HomePage";
import { LoginForm } from "./components/Auth/LoginForm";
import { RegisterForm } from "./components/Auth/RegisterForm";
import { ForgotPasswordForm } from "./components/Auth/ForgotPasswordForm";
import { ResetPasswordForm } from "./components/Auth/ResetPasswordForm";
import { GoogleLoginSuccess } from "./components/Auth/GoogleLoginSuccess";
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
import { SharedCartPage } from "./components/Cart/SharedCartPage";
import NotFound from "./pages/NotFound";
import { ComboPage } from "./components/Combo/ComboPage";
import { ComboDetailPage } from "./components/Combo/ComboDetailPage";
import { QuickFixTest } from './components/Product/quickFix';
import { EditProfilePage } from "./components/Profile/EditProfilePage";
import { PaymentResultPage } from './pages/PaymentResultPage'; // ✅ Correctly imported

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
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          <Route path="/google-login-success" element={<GoogleLoginSuccess />} /> 
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/combo" element={<ComboPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/combo/:id" element={<ComboDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/shared-cart" element={<SharedCartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/messenger" element={<MessengerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/payment-info" element={<div>Payment Info - Coming Soon</div>} />
          <Route path="/addresses" element={<div>Addresses - Coming Soon</div>} />
          <Route path="/notifications" element={<div>Notifications - Coming Soon</div>} />
          <Route path="/privacy" element={<div>Privacy - Coming Soon</div>} />
          <Route path="/language" element={<div>Language - Coming Soon</div>} />
          <Route path="/help" element={<div>Help - Coming Soon</div>} />
          <Route path="/lucky-wheel" element={<LuckyWheelPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/ai-tryon" element={<AITryOnPage />} />
          {/* ✅ Enhanced Payment Result Route - Handles VNPay callbacks */}
          <Route path="/payment-result" element={<PaymentResultPage />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/quick-fix" element={<QuickFixTest />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;