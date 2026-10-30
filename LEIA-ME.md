# Ficha de Operador 141, site + app

O mesmo código vira três coisas: o site, o app instalável pelo navegador (PWA) e o app nativo Android/iOS (Capacitor).

```
/                  o site (index.html, *.js, sons, icones...). É o que a Vercel publica.
/app               projeto do app nativo (Capacitor). Copia o site para app/www na hora de compilar.
/.github/workflows android.yml: o GitHub compila o APK sozinho a cada push.
```

Ao mexer no site, o app pega a mudança na próxima compilação. Não precisa editar nada em `/app`.

## 1. App pelo navegador (PWA), iPhone e Android, sem loja

Basta publicar o repositório na Vercel do jeito de sempre. Depois, no celular:

- **iPhone (Safari):** abrir o site, Compartilhar > Adicionar à Tela de Início.
- **Android (Chrome):** abrir o site, menu ⋮ > Instalar app (ou Adicionar à tela inicial).

Funciona sem internet depois da primeira abertura. As fichas ficam no aparelho.
O código (HTML/JS) se atualiza sozinho: a versão nova aparece na abertura seguinte. Se trocar sons ou imagens, mude `VERSAO` no começo do `sw.js`.

## 2. APK Android (GitHub Actions, sem instalar nada no PC)

1. Suba este repositório inteiro no GitHub, incluindo `.github/` e `app/debug.keystore`.
2. Na aba **Actions**, a execução "App Android (APK)" roda sozinha a cada push. Ela também pode ser iniciada em *Run workflow*. Leva uns 5 a 8 minutos.
3. Quando terminar, o `Ficha141.apk` aparece em **Releases**. O link fixo para mandar para os jogadores fica assim:
   `https://github.com/USUARIO/REPOSITORIO/releases/latest/download/Ficha141.apk`
4. No celular, baixar e abrir o APK. Na primeira vez, o Android pede para permitir "instalar apps desconhecidos" para o navegador ou o gerenciador de arquivos.

**Não apague `app/debug.keystore`.** É a assinatura do app. Com ela, cada APK novo instala por cima do antigo e as fichas continuam salvas. Se a chave mudar, o Android exige desinstalar, e desinstalar apaga as fichas do app. Nesse caso, exporte os .json antes.

Compilar no próprio PC (opcional): instale Node 20+ e Android Studio, depois rode
`cd app && npm install && npm run android && npm run abrir:android` e use ▶ Run no Android Studio.

## 3. iPhone nativo (precisa de um Mac)

A Apple só deixa compilar apps de iPhone no Xcode, em um Mac.

```
cd app
npm install
npm run ios           # cria app/ios, ícones e plugins (precisa do CocoaPods: brew install cocoapods)
npm run abrir:ios     # abre no Xcode
```

No Xcode, escolha o seu time em *Signing & Capabilities*, conecte o iPhone e rode ▶.

- **Apple ID grátis:** o app funciona no seu iPhone, mas expira em 7 dias e precisa ser reinstalado pelo Xcode.
- **Apple Developer (US$ 99/ano):** libera o TestFlight (link de convite para os jogadores) e a App Store.

Para os jogadores com iPhone, o PWA (item 1) resolve sem custo.

## 4. Lojas (opcional)

- **Google Play:** conta de desenvolvedor (US$ 25, pagamento único). Gere um *AAB assinado* no Android Studio (Build > Generate Signed Bundle) com uma chave de upload própria. Não use a `debug.keystore` na loja.
- **App Store:** Apple Developer (US$ 99/ano) e envio pelo Xcode (Product > Archive).
- O ícone usa a caveira do `logo.png`. Se a arte vier de outra marca, as lojas podem recusar. Para publicar, use uma arte própria em `app/assets/` (icon-only.png 1024×1024, icon-foreground.png, icon-background.png, splash.png 2732×2732).

## Onde as fichas ficam salvas

| Onde roda | Armazenamento |
|---|---|
| App nativo | Arquivos `.json` na pasta de dados do app (um por operador) |
| Site / PWA | IndexedDB do navegador |

Na primeira abertura, a ficha antiga do navegador (autosave e salvamento rápido) é importada sozinha para a lista.
Cada aparelho tem a sua lista. Para passar uma ficha de um aparelho para outro, use Exportar .json e Importar.
