# Próximos passos do Studify

Anotações do que vamos mudar. Nada disso foi começado ainda, exceto o que está em "Já feito".

## Já feito (v1.1, ainda numa branch, fora da `main`)

- Cronômetro do Pomodoro funciona em qualquer aba, em segundo plano e com o app fechado
- Repetição semanal, mensal e a cada N dias
- Fotos nas tarefas (câmera e galeria)
- Widget na tela inicial do Android
- Versão 1.1.0 / `versionCode` 2, para instalar o APK por cima do anterior

## Antes de entregar a v1.1

- [ ] Gerar o APK no computador e instalar por cima da versão antiga (os dados devem continuar lá)
- [ ] Testar no celular: câmera, fotos, widget e o cronômetro trocando de aba
- [ ] Decidir o destino do código da v1.1: branch com nome limpo, direto na `main`, ou descartar

## 0. Nome novo: Studify

Feito em 17/10/2026: o app se chama **Studify** (study + -ify, "organizar os estudos") em tudo que aparece: nome no Android, permissões, widget, backup, README, `SUPABASE.md` e licença. Os recursos do widget agora usam o prefixo `studify_`.

Como ninguém usa a versão antiga, o identificador também mudou: pacote `com.otavio.studify` e banco `studify.db`. O APK novo instala como app novo, do zero.

Pendente:

- [ ] Renomear o repo do app e o do site no GitHub (hoje com o nome antigo)

## 1. Design do app

Feito em 17/10/2026 (ainda sem commit e sem teste no celular):

- Paleta "Caneta azul" no `theme.js` (papel #F3EFE6, tinta #1F3A93, margem vermelha #C8442F)
- Logo nova "Pena" (ponta de caneta-tinteiro): ícone, ícone adaptativo, notificação, splash, favicon, widget e logo horizontal com "studify"
- Nenhum emoji no app: viraram ícones Lucide (`@react-native-vector-icons/lucide`) e os textos ficaram neutros
- Cantos retos (raio 4 a 8) em cards, botões, etiquetas, checkbox, calendário e Pomodoro
- Fonte Bricolage Grotesque em tudo, sem fonte do sistema: telas (`fonts` no `theme.js`, carregada no `App.js`), logo e widget (`res/font`)

Falta:

- [ ] Redesenhar as telas (cantos, cards, tipografia), seguindo o mock das paletas
- [ ] Gerar o APK e conferir no celular

- Revisar o visual inteiro, que hoje incomoda
- Usar as skills de visualização do Otávio (ele vai enviar do computador)
- Rever cores, espaçamentos, cards, tela do Pomodoro e resumo

## 2. Vários aparelhos com a mesma conta (Supabase)

Objetivo: a mesma conta em mais de um celular, com tudo igual.

- Retomar o Supabase, que já existe no projeto mas com configuração manual
- O cliente não entende de tecnologia: o produto tem que chegar pronto
- Login simples, de preferência com a conta Google
- Sem passo a passo técnico para o cliente (hoje o `SUPABASE.md` leva uns 10 minutos)

Decisões pendentes:

- [ ] Um Supabase único para todos os clientes, ou um por cliente?
- [ ] Como fica o login com Google dentro do app Android
- [ ] O que acontece com quem já usa o app sem conta (migrar os dados locais)

## 3. Fotos em vários aparelhos

- Hoje as fotos ficam só no aparelho e não entram no backup nem na sincronização
- Levar as fotos para o Supabase Storage, para dois celulares verem as mesmas fotos

## 4. Melhorias menores

- Widget que atualiza no instante em que uma tarefa muda (hoje: ao sair do app, a cada 15 min ou no botão ↻)
- Cronômetro com notificação fixa mostrando o tempo restante
- Anexar PDFs e outros arquivos, além de fotos
- Assinar os commits para aparecerem como "Verified" no GitHub (opcional)

## Sempre que lançar uma versão nova

1. Aumentar `android.versionCode` e `version` no `app.json`
2. Gerar o APK com a mesma chave de assinatura
3. Instalar por cima, sem desinstalar
