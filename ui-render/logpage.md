# OmniRAG Login Page UI Specification

## Mục tiêu

Tái tạo giao diện đăng nhập giống ảnh tham chiếu bằng HTML + CSS
(Tailwind hoặc CSS thuần).

## Layout tổng thể

-   Viewport: `100vw x 100vh`
-   Chia thành 2 cột:
    -   Left: `48%`
    -   Right: `52%`
-   Background:
    -   Gradient rất nhạt từ trắng → xanh nhạt.
    -   Có các họa tiết chấm nhỏ và các đường cong mờ ở góc dưới trái.

------------------------------------------------------------------------

# Left Panel

## Padding

-   Top: 72px
-   Left: 72px
-   Right: 48px

## Logo

-   Icon hình lục giác gradient xanh/tím
-   Text:
    -   OmniRAG
    -   Font: Inter
    -   Weight: 700
    -   Size: 26px

Khoảng cách dưới logo: 72px

------------------------------------------------------------------------

## Badge

Nội dung:

AI-POWERED RAG PLATFORM

Style

-   pill
-   background: #EEF3FF
-   text: #2F5BFF
-   radius:999px
-   height:36px
-   padding:0 18px
-   font-size:14px
-   weight:600

Margin-bottom:48px

------------------------------------------------------------------------

## Hero Heading

Dòng 1

Your knowledge.

-   72px
-   800
-   màu #101828

Dòng 2

Grounded AI answers.

-   Gradient:
    -   #2563EB
    -   #7C3AED
-   72px
-   800

Khoảng cách giữa 2 dòng:8px

Margin-bottom:28px

------------------------------------------------------------------------

## Description

OmniRAG connects your company's data to AI assistants that answer with
verified sources and zero guesswork.

-   Width khoảng 470px
-   Font 18px
-   Line-height 1.6
-   Màu #475467

verified sources

và

zero guesswork

màu xanh (#2563EB) font-weight 600

Margin-bottom:60px

------------------------------------------------------------------------

## Feature List

Vertical Stack

Gap:32px

Item:

Icon box

-   58x58
-   white
-   border #E4E7EC
-   radius16

Text

Title

-   28px
-   700
-   #101828

Description

-   18px
-   #667085

Items:

1.  

Secure & Private

Your data stays in your workspace and is never used to train models.

2.  

Verified Answers

Every answer is grounded in your documents with citations.

3.  

Team Collaboration

Work together with roles, permissions, and workspace isolation.

------------------------------------------------------------------------

# Right Panel

Nội dung căn giữa.

Card

-   Width:660px
-   Radius:24px
-   Background:white
-   Border:#EAECF0
-   Shadow rất nhẹ

Padding:

64px

------------------------------------------------------------------------

## Tabs

2 tabs

Log in

Create account

Height:60px

Tab active

-   Text xanh
-   Underline 3px
-   Width underline khoảng 250px

------------------------------------------------------------------------

## Heading

Welcome back

-   48px
-   700

Subtext

Log in to your OmniRAG workspace

18px

#667085

------------------------------------------------------------------------

## Google Button

Height:58px

Border:#D0D5DD

Radius:12px

Icon Google bên trái

Text:

Continue with Google

------------------------------------------------------------------------

Divider

----- or continue with email -----

------------------------------------------------------------------------

Email Field

Label

Email address

Input

Height:58px

Radius12

Border #D0D5DD

Leading email icon

Placeholder

you@company.com

------------------------------------------------------------------------

Password

Tương tự

Leading lock icon

Trailing eye icon

Placeholder

Enter your password

------------------------------------------------------------------------

Remember Row

Checkbox trái

Remember me

Phải

Forgot password?

text xanh

------------------------------------------------------------------------

Primary Button

Height:58px

Radius12

Gradient

#2563EB → #7C3AED

Text trắng

Log in

------------------------------------------------------------------------

Divider

New to OmniRAG?

------------------------------------------------------------------------

Secondary Button

Height:58px

Radius12

Border

#7C3AED

Text

Create your account

------------------------------------------------------------------------

Footer

Icon lock

Your data is encrypted and protected

Margin-top:28px

Bên dưới

SOC 2 Type II

•

GDPR Compliant

•

ISO 27001

Màu xám

16px

------------------------------------------------------------------------

# Design Tokens

## Font

Inter

## Colors

Primary Blue: #2563EB

Primary Purple: #7C3AED

Heading: #101828

Body: #475467

Muted: #667085

Border: #D0D5DD

Card Border: #EAECF0

Background: #FFFFFF

Surface: #F8FAFC

## Radius

Card:24px

Button/Input:12px

Small:8px

Pill:999px

## Shadow

0 10px 40px rgba(16,24,40,.08)

## Responsive

Desktop \>=1280: - hai cột.

Tablet: - left 45% - right 55%

Mobile (\<768): - ẩn panel trái - card full width - padding 24px.
