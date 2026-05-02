import NextAuth, { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "keyrock",
      name: "Keyrock",
      type: "oauth",
      clientId: process.env.KEYROCK_CLIENT_ID || "",
      clientSecret: process.env.KEYROCK_CLIENT_SECRET || "",
      authorization: {
        url: `${process.env.KEYROCK_URL || "http://localhost:3005"}/oauth2/authorize`,
        params: { scope: "openid profile email" },
      },
      token: `${process.env.KEYROCK_URL || "http://localhost:3005"}/oauth2/token`,
      userinfo: `${process.env.KEYROCK_URL || "http://localhost:3005"}/user`,
      profile(profile) {
        return {
          id: profile.id || profile.sub,
          name: profile.displayName || profile.username,
          email: profile.email,
          roles: profile.roles || [],
        };
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.roles = (profile as { roles?: string[] })?.roles || [];
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        roles: token.roles,
      };
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
