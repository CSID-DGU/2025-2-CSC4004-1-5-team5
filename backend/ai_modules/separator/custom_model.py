import torch
import torch.nn as nn
import torch.nn.functional as F


# -------------------------------------------------------------
# Filterbank (encoder / decoder 공통 구조)
# -------------------------------------------------------------

class Filterbank(nn.Module):
    def __init__(self, n_filters, kernel_size):
        super().__init__()
        self._filters = nn.Parameter(torch.randn(n_filters, 1, kernel_size))
        self.torch_window = nn.Parameter(torch.randn(n_filters), requires_grad=True)

    def forward(self, x):
        # Conv1d 형태의 학습 필터 적용
        out = F.conv1d(x, self._filters, stride=1, padding=0)
        return out


# -------------------------------------------------------------
# Complex Conv Block (re/im structure 유지)
# -------------------------------------------------------------

class ComplexConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel):
        super().__init__()
        self.re_conv = nn.Conv1d(in_ch, out_ch, kernel, padding=kernel // 2)
        self.im_conv = nn.Conv1d(in_ch, out_ch, kernel, padding=kernel // 2)

        self.re_norm = nn.BatchNorm1d(out_ch)
        self.im_norm = nn.BatchNorm1d(out_ch)

        self.re_activation = nn.PReLU()
        self.im_activation = nn.PReLU()

    def forward(self, x_re, x_im):
        re = self.re_conv(x_re) - self.im_conv(x_im)
        im = self.re_conv(x_im) + self.im_conv(x_re)

        re = self.re_norm(re)
        im = self.im_norm(im)

        return self.re_activation(re), self.im_activation(im)


# -------------------------------------------------------------
# RNN Block (masker.encoders.6.rnn.* 구조 복원)
# -------------------------------------------------------------

class RNNBlock(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.rnn = nn.GRU(dim, dim, batch_first=True, bidirectional=True)
        self.linear = nn.Linear(dim * 2, dim)

    def forward(self, x):
        out, _ = self.rnn(x)
        out = self.linear(out)
        return out


# -------------------------------------------------------------
# Decoder Block (Deconv + Norm + PReLU)
# -------------------------------------------------------------

class DecoderBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel):
        super().__init__()
        self.deconv = nn.ConvTranspose1d(in_ch, out_ch, kernel, padding=kernel // 2)
        self.norm = nn.BatchNorm1d(out_ch)
        self.activation = nn.PReLU()

    def forward(self, x):
        x = self.deconv(x)
        x = self.norm(x)
        return self.activation(x)


# -------------------------------------------------------------
# CustomSeparator — ai.pth 구조에 맞춘 최종 모델
# -------------------------------------------------------------

class CustomSeparator(nn.Module):
    def __init__(self):
        super().__init__()

        # -------------------------------
        # Encoder filterbanks (복원)
        # -------------------------------
        self.encoder = Filterbank(n_filters=514, kernel_size=400)

        # -------------------------------
        # Masker Encoders (0~5)
        # conv + norm + activation
        # -------------------------------

        conv_channels = [514, 256, 128, 128, 128, 128, 128]

        self.masker_encoders = nn.ModuleList()
        for i in range(6):
            block = ComplexConvBlock(
                in_ch=conv_channels[i],
                out_ch=conv_channels[i + 1],
                kernel=3
            )
            self.masker_encoders.append(block)

        # -------------------------------
        # RNN Block (masker.encoders.6.*)
        # -------------------------------
        self.rnn_block = RNNBlock(128)

        # -------------------------------
        # Linear block after RNN
        # masker.encoders.6.linear.*
        # -------------------------------
        self.post_rnn_linear = nn.Linear(128, 128)

        # -------------------------------
        # Decoder blocks (masker.decoders.1~5)
        # -------------------------------
        dec_channels = [128, 128, 128, 128, 128, 514]

        self.masker_decoders = nn.ModuleList()
        for i in range(1, 6):
            block = DecoderBlock(
                in_ch=dec_channels[i - 1],
                out_ch=dec_channels[i],
                kernel=3
            )
            self.masker_decoders.append(block)

        # -------------------------------
        # Output layer
        # -------------------------------
        self.output_re = nn.Conv1d(514, 1, 1)
        self.output_im = nn.Conv1d(514, 1, 1)

        # -------------------------------
        # Decoder filterbank (reconstruction)
        # -------------------------------
        self.decoder = Filterbank(n_filters=514, kernel_size=400)

    # ---------------------------------------------------------
    # Forward
    # ---------------------------------------------------------
    def forward(self, x):
        # x: [B, 1, T]

        # ---- Encoder ----
        encoded = self.encoder(x)  # [B, 514, T']

        re, im = encoded, torch.zeros_like(encoded)

        # ---- Masker encoders ----
        for block in self.masker_encoders:
            re, im = block(re, im)

        # ---- RNN ----
        B, C, T = re.shape
        rnn_input = re.transpose(1, 2)  # [B, T, C]
        rnn_out = self.rnn_block(rnn_input)
        rnn_out = self.post_rnn_linear(rnn_out)  # [B, T, C]
        rnn_out = rnn_out.transpose(1, 2)

        # ---- Decoders ----
        x_dec = rnn_out
        for block in self.masker_decoders:
            x_dec = block(x_dec)

        # ---- Output mask ----
        mask_re = self.output_re(x_dec)
        mask_im = self.output_im(x_dec)

        # ---- Apply complex mask ----
        out = mask_re  # 단일 채널 출력

        return out
