# Iteration 10 - generate 10 diary stamps
$ErrorActionPreference = "Stop"
$stampsDir = "C:\Users\kitap\.openclaw\workspace\magic-diary-work\public\images\diary-stamps"
$rawDir = "C:\Users\kitap\.openclaw\workspace\output\stamps-raw"
New-Item -ItemType Directory -Path $rawDir -Force | Out-Null

$genScript = "C:\Users\kitap\.openclaw\skills\image01\scripts\gen_image.py"

$stamps = @(
  @{ name = "wand";       prompt = "A single ornate wizard wand centered horizontally in the frame, intricate Celtic knotwork and runic carvings along the dark walnut wood shaft, phoenix feather core glowing faintly visible through a translucent crystal tip, warm candlelight from the upper left, isolated subject on aged yellowed parchment background, circular composition, vintage oil-painting style reminiscent of 19th century English still-life, rich sepia and amber color palette, dramatic chiaroscuro lighting, photorealistic with painterly texture, 4K, masterpiece, ultra detailed wood grain" },
  @{ name = "broom";      prompt = "A vintage polished mahogany broomstick centered diagonally in the frame, handle wrapped in worn burgundy leather with brass studs, bound birch twigs at the sweeping base, warm hearth firelight from a distant arched window, isolated subject on dark Hogwarts stone background, circular composition with subject centered, 1920s English poster art style with bold outlines, rich umber and gold tones, photorealistic textures on wood and stone, 4K, masterpiece" },
  @{ name = "owl";        prompt = "A majestic snowy white barn owl with piercing amber eyes facing forward centered in the frame, perched on a single small leather-bound book, soft silver moonlight from above, isolated subject on dark blue night sky background, circular composition, Victorian botanical illustration aesthetic combined with photorealistic feather detail, cool blue moonlit palette contrasted with warm amber eye highlights, 4K, masterpiece, ultra detailed plumage texture" },
  @{ name = "spellbook";  prompt = "A single weathered leather-bound spell book centered in the frame, ancient brown leather cover with brass corner protectors and a faded gold-embossed star on the front, a small leather bookmark ribbon hanging out, isolated subject on dark wooden table background, warm candlelight from upper left, circular composition, vintage 19th century English book illustration style, rich umber and gold tones, 4K, masterpiece, ultra detailed leather grain and brass metalwork" },
  @{ name = "potion";     prompt = "A single ornate glass potion bottle centered in the frame, round-bellied with a long narrow neck, cork stopper tied with twine, glowing emerald-green liquid inside with small floating sparkles, isolated subject on dark apothecary shelf background, soft candlelight from above casting green refractions on the glass, circular composition, vintage apothecary illustration style, rich jewel tones of emerald and amber, 4K, masterpiece, ultra detailed glass and cork texture" },
  @{ name = "candle";     prompt = "A single beeswax candle centered vertically in the frame, partially melted with a glowing flame casting warm orange light, fresh ivory-white wax with a small brass candleholder base, isolated subject on dark stone background, warm chiaroscuro lighting, circular composition, vintage oil-painting still-life style, rich amber and gold tones, 4K, masterpiece, ultra detailed wax texture and flame glow" },
  @{ name = "key";        prompt = "A single ornate brass skeleton key centered in the frame, antique Victorian design with intricate bow (head) shaped like a small shield, worn brass patina with hints of green oxidation, isolated subject on dark wood background, warm candlelight from upper left, circular composition, vintage English antique illustration style, rich brass and amber tones, 4K, masterpiece, ultra detailed metalwork" },
  @{ name = "mandrake";   prompt = "A single magical Mandrake root centered in the frame, a small humanoid plant creature with leafy green foliage sprouting from its head, twisted brown root body with two stubby arms, surprised wide-eyed face, isolated subject on dark loamy soil background, soft magical glow around the creature, circular composition, vintage 1920s English botanical illustration style, rich earthy greens and browns, 4K, masterpiece, ultra detailed root texture" },
  @{ name = "scroll";     prompt = "A single rolled parchment scroll centered horizontally in the frame, aged yellowed parchment tied with a red wax seal and gold cord, faint magical runes visible on the partially unrolled edge, isolated subject on dark leather background, warm candlelight from above, circular composition, vintage 19th century English manuscript illustration style, rich sepia and gold tones, 4K, masterpiece, ultra detailed parchment texture and wax seal" }
)

foreach ($s in $stamps) {
  $out = Join-Path $rawDir ($s.name + ".jpg")
  Write-Host "Generating $($s.name)..." -ForegroundColor Cyan
  & python $genScript $s.prompt $out --aspect 1:1 --n 1 --no-prompt-optimizer --timeout 90 --retries 2
  if (Test-Path $out) {
    $size = (Get-Item $out).Length
    Write-Host "  -> $out ($size bytes)" -ForegroundColor Green
  } else {
    Write-Host "  FAILED" -ForegroundColor Red
  }
}

Write-Host "`nDone."
