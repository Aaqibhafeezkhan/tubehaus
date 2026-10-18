# HomeTube server + Cloudflare WARP in one container.
# WARP lives here (not in its own container) so the server can reconnect it for a
# fresh address whenever YouTube starts answering "confirm you're not a bot".

# ---- whisper.cpp for live captions (optional: --build-arg WITH_WHISPER=0 to skip)
FROM debian:bookworm-slim AS whisper
ARG WITH_WHISPER=1
ARG WHISPER_VERSION=v1.9.4
RUN mkdir -p /out && if [ "$WITH_WHISPER" = "1" ]; then \
      apt-get update && apt-get install -y --no-install-recommends build-essential cmake git ca-certificates curl && \
      git clone --depth 1 --branch "$WHISPER_VERSION" https://github.com/ggml-org/whisper.cpp /src && \
      cmake -S /src -B /src/build -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_EXAMPLES=ON && \
      cmake --build /src/build -j"$(nproc)" --config Release --target whisper-cli && \
      cp /src/build/bin/whisper-cli /out/ && \
      curl -fL -o /out/ggml-base-q5_1.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin; \
    fi

# ---- runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg unzip python3 python3-venv ffmpeg socat && \
    curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | gpg --dearmor -o /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ bookworm main" \
      > /etc/apt/sources.list.d/cloudflare-client.list && \
    apt-get update && apt-get install -y --no-install-recommends cloudflare-warp && \
    rm -rf /var/lib/apt/lists/*

# live streams: yt-dlp + the PO-token plugin (its server runs in the "bgutil" container)
# and deno, which yt-dlp needs for YouTube's JavaScript challenges
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir "yt-dlp[default]" bgutil-ytdlp-pot-provider && \
    curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh -s -- -y

COPY --from=whisper /out/ /opt/whisper/
COPY server/ /app/server/
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV HT_BIND=0.0.0.0 HT_PORT=3010 HT_STATE=/data \
    HT_YT_PROXY=127.0.0.1:40000 HT_WARP_ROTATE=1 \
    HT_YTDLP=/opt/venv/bin/yt-dlp \
    HT_WHISPER_BIN=/opt/whisper/whisper-cli HT_WHISPER_MODEL=/opt/whisper/ggml-base-q5_1.bin \
    HT_DOWNLOAD_DIR=/data/dl
VOLUME ["/data", "/var/lib/cloudflare-warp"]
EXPOSE 3010 1080
ENTRYPOINT ["/entrypoint.sh"]
