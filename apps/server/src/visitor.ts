import { createHash } from "node:crypto"
import { getCookie, setCookie } from "hono/cookie"
import { createId } from "./utils"

const VISITOR_COOKIE = "qf_visitor"

export const getClientIp = (c: any) => {
  const forwarded = c.req.header("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return c.req.header("x-real-ip") || "unknown"
}

const getVisitorFingerprint = (c: any, ip: string) => {
  const userAgent = c.req.header("user-agent") || "unknown"
  const acceptLanguage = c.req.header("accept-language") || "unknown"
  const secChUa = c.req.header("sec-ch-ua") || "unknown"
  const secChUaPlatform = c.req.header("sec-ch-ua-platform") || "unknown"

  return createHash("sha256")
    .update([ip, userAgent, acceptLanguage, secChUa, secChUaPlatform].join("|"))
    .digest("hex")
}

export const ensureVisitor = (c: any) => {
  const existing = getCookie(c, VISITOR_COOKIE)
  if (!existing) {
    setCookie(c, VISITOR_COOKIE, createId("visitor"), {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  const ip = getClientIp(c)
  return {
    ip,
    visitorId: getVisitorFingerprint(c, ip),
  }
}
