import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0', // Thay đổi từ '::' thành '0.0.0.0' để cho phép truy cập từ mạng nội bộ
    port: 8080,
    strictPort: true, // Đảm bảo cổng không bị thay đổi nếu đã được sử dụng
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));