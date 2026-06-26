export const defaultHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hanzo Project</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .loading-dot {
      animation: pulse 1.5s ease-in-out infinite;
    }
    .gradient-animate {
      background: linear-gradient(90deg, #9333ea, #737373, #3b82f6, #9333ea);
      background-size: 300% 300%;
      animation: gradient 8s ease infinite;
    }
  </style>
</head>
<body class="bg-black text-white min-h-screen flex items-center justify-center">
  <div class="text-center px-8">
    <!-- Hanzo Logo -->
    <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-8 mx-auto transform hover:scale-110 transition-transform">
      <span class="text-white font-bold text-4xl">H</span>
    </div>

    <!-- Loading Animation -->
    <div class="flex justify-center space-x-2 mb-8">
      <div class="w-3 h-3 bg-purple-600 rounded-full loading-dot"></div>
      <div class="w-3 h-3 bg-purple-600 rounded-full loading-dot" style="animation-delay: 0.2s;"></div>
      <div class="w-3 h-3 bg-purple-600 rounded-full loading-dot" style="animation-delay: 0.4s;"></div>
    </div>

    <!-- Status Text -->
    <h1 class="text-2xl font-bold mb-4 bg-clip-text text-transparent gradient-animate">
      Initializing Hanzo AI
    </h1>

    <p class="text-gray-400 text-sm">
      Your AI-powered application is being generated...
    </p>

    <!-- Progress Indicator -->
    <div class="mt-8 max-w-xs mx-auto">
      <div class="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" style="width: 0%; animation: progress 3s ease-out forwards;"></div>
      </div>
    </div>
  </div>

  <style>
    @keyframes progress {
      to { width: 100%; }
    }
  </style>
</body>
</html>
`;
